import { expect, test, type Page } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

async function waitForNotesList(page: Page): Promise<void> {
  await expect(page.getByTestId('sidebar-navigation')).toBeVisible()
  await expect(page.getByTestId('notes-list')).toBeVisible()
}

test('filters the notes list to notes with pending tasks', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('Inbox task.md', '', '2026-03-26T12:00:00.000Z', {
      hasTasks: true,
    }),
    createMockNote('Inbox done.md', '', '2026-03-25T12:00:00.000Z', {
      hasTasks: false,
    }),
    createMockNote('Work/task.md', '', '2026-03-24T12:00:00.000Z', {
      hasTasks: true,
    }),
  ])

  await page.goto('/')
  await waitForNotesList(page)
  await expect(page.locator('[data-note-id="Inbox task.md"]')).toBeVisible()
  await waitForEditorReady(page)
  await page.locator('[data-navigation-id="tasks"]').click()

  const noteIds = await page
    .getByTestId('notes-list-item')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-note-id') ?? ''),
    )

  expect(noteIds).toEqual(['Inbox task.md', 'Work/task.md'])
})

test('marks Tasks as the selected navigation item when active', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('Inbox task.md', '', '2026-03-26T12:00:00.000Z', {
      hasTasks: true,
    }),
    createMockNote('Inbox done.md', '', '2026-03-25T12:00:00.000Z', {
      hasTasks: false,
    }),
  ])

  await page.goto('/')
  await waitForNotesList(page)
  await expect(page.locator('[data-note-id="Inbox task.md"]')).toBeVisible()
  await waitForEditorReady(page)
  await page.locator('[data-navigation-id="tasks"]').click()

  await expect(
    page.locator('[data-navigation-id="tasks"]').first(),
  ).toHaveAttribute('data-selected', 'true')
  await expect(
    page.locator('[data-navigation-id="inbox"]').first(),
  ).toHaveAttribute('data-selected', 'false')
})
