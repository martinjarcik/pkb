import { expect, test, type Page } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

async function waitForNotesList(page: Page): Promise<void> {
  await expect(page.getByTestId('sidebar-navigation')).toBeVisible()
  await expect(page.getByTestId('notes-list')).toBeVisible()
}

test('soft-deleted note leaves inbox and appears in Trashed without note controls', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('First.md', '# One', '2026-03-26T12:00:00.000Z', {
      hasTasks: false,
    }),
    createMockNote('Second.md', '# Two', '2026-03-25T12:00:00.000Z', {
      hasTasks: false,
    }),
  ])

  await page.goto('/')
  await waitForNotesList(page)
  await expect(page.locator('[data-note-id="First.md"]')).toBeVisible()
  await waitForEditorReady(page)

  await page.getByTestId('note-delete').click()

  await expect(page.locator('[data-note-id="First.md"]')).toHaveCount(0)
  await expect(page.locator('[data-note-id="Second.md"]')).toBeVisible()

  await page.locator('[data-navigation-id="trashed"]').click()

  await expect(page.locator('[data-note-id="First.md"]')).toBeVisible()
  await expect(page.getByTestId('note-controls')).toHaveCount(0)
})

test('dragging a trashed note to Inbox restores it to the inbox list', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('Trashed.md', '# T', '2026-03-26T12:00:00.000Z', {
      hasTasks: false,
      trashedAt: '2026-03-20T12:00:00.000Z',
    }),
  ])

  await page.goto('/')
  await waitForNotesList(page)
  await page.locator('[data-navigation-id="trashed"]').click()
  await expect(page.locator('[data-note-id="Trashed.md"]')).toBeVisible()

  const noteRow = page.locator('[data-note-id="Trashed.md"]')
  const inboxNav = page.locator('[data-navigation-id="inbox"]').first()

  await noteRow.dragTo(inboxNav)

  await page.locator('[data-navigation-id="inbox"]').click()
  await expect(page.locator('[data-note-id="Trashed.md"]')).toBeVisible()
})
