import { expect, test, type Page } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

async function waitForNotesList(page: Page): Promise<void> {
  await expect(page.getByTestId('sidebar-navigation')).toBeVisible()
  await expect(page.getByTestId('notes-list')).toBeVisible()
}

test('favorites view lists only favorited non-trashed notes', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('Plain.md', '# P', '2026-03-26T12:00:00.000Z', {
      hasTasks: false,
    }),
    createMockNote('Starred.md', '# S', '2026-03-25T12:00:00.000Z', {
      hasTasks: false,
      favorite: true,
    }),
    createMockNote('TrashedFav.md', '# T', '2026-03-24T12:00:00.000Z', {
      hasTasks: false,
      favorite: true,
      trashedAt: '2026-03-20T12:00:00.000Z',
    }),
  ])

  await page.goto('/')
  await waitForNotesList(page)
  await expect(page.getByTestId('notes-list-item')).toHaveCount(2)
  await expect(
    page.locator('[data-navigation-id="inbox"]').first(),
  ).toHaveAttribute('data-selected', 'true')
  await page.locator('[data-navigation-id="favorites"]').first().click()
  await expect(
    page.locator('[data-navigation-id="favorites"]').first(),
  ).toHaveAttribute('data-selected', 'true')

  const list = page.getByTestId('notes-list')

  await expect(list.locator('[data-note-id="Starred.md"]')).toBeVisible()
  await expect(list.locator('[data-note-id="Plain.md"]')).toHaveCount(0)
  await expect(list.locator('[data-note-id="TrashedFav.md"]')).toHaveCount(0)
})

test('favorite control adds note to favorites view', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('Plain.md', '# P', '2026-03-26T12:00:00.000Z', {
      hasTasks: false,
    }),
  ])

  await page.goto('/')
  await waitForNotesList(page)
  await page.locator('[data-note-id="Plain.md"]').click()
  await waitForEditorReady(page)
  await page.getByTestId('note-favorite').click()
  await page.locator('[data-navigation-id="favorites"]').first().click()

  await expect(
    page.getByTestId('notes-list').locator('[data-note-id="Plain.md"]'),
  ).toBeVisible()
})
