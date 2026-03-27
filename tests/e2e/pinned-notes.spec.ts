import { expect, test } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

test('pin control moves note to top of inbox list and toggles off', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('Newer.md', '# N', '2026-03-26T12:00:00.000Z', {
      hasTasks: false,
    }),
    createMockNote('Older.md', '# O', '2026-03-20T12:00:00.000Z', {
      hasTasks: false,
    }),
  ])

  await page.goto('/')
  await expect(page.getByTestId('notes-list')).toBeVisible()
  await page.locator('[data-note-id="Older.md"]').click()
  await waitForEditorReady(page)
  await page.getByTestId('note-pin').click()

  const items = page.getByTestId('notes-list-item')

  await expect(items.nth(0)).toHaveAttribute('data-note-id', 'Older.md')
  await expect(items.nth(0)).toHaveAttribute('data-pinned', 'true')

  await page.getByTestId('note-pin').click()

  await expect(items.nth(0)).toHaveAttribute('data-note-id', 'Newer.md')
  await expect(items.nth(0)).toHaveAttribute('data-pinned', 'false')
})
