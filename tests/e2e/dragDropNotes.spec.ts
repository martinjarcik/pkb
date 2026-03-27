import { expect, type Page, test } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

function noteRow(page: Page, noteId: string) {
  return page.locator(`[data-note-id="${noteId}"]`)
}

async function dragNoteToNavigationTarget(
  page: Page,
  noteId: string,
  navigationId: string,
): Promise<void> {
  await noteRow(page, noteId).dragTo(
    page.locator(`[data-navigation-id="${navigationId}"]`),
  )
}

test('moves an inbox note into a folder', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('Pasta.md', '# Pasta'),
    createMockNote('recipes/existing.md', '# Existing recipe'),
    createMockNote('Other.md', '# Other'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)

  await dragNoteToNavigationTarget(page, 'Pasta.md', 'folder:recipes')

  await expect(noteRow(page, 'Pasta.md')).toHaveCount(0)
  await page.locator('[data-navigation-id="folder:recipes"]').click()
  await expect(noteRow(page, 'recipes/Pasta.md')).toBeVisible()
})

test('moves a folder note back to Inbox', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('recipes/Pasta.md', '# Pasta'),
    createMockNote('recipes/existing.md', '# Existing recipe'),
    createMockNote('Other.md', '# Other'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await page.locator('[data-navigation-id="folder:recipes"]').click()

  await dragNoteToNavigationTarget(page, 'recipes/Pasta.md', 'inbox')

  await expect(noteRow(page, 'recipes/Pasta.md')).toHaveCount(0)
  await page.locator('[data-navigation-id="inbox"]').click()
  await expect(noteRow(page, 'Pasta.md')).toBeVisible()
})

test('moves a note between folders', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('work/Report.md', '# Report'),
    createMockNote('archive/existing.md', '# Archived'),
    createMockNote('work/Another.md', '# Another'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await page.locator('[data-navigation-id="folder:work"]').click()

  await dragNoteToNavigationTarget(page, 'work/Report.md', 'folder:archive')

  await expect(noteRow(page, 'work/Report.md')).toHaveCount(0)
  await page.locator('[data-navigation-id="folder:archive"]').click()
  await expect(noteRow(page, 'archive/Report.md')).toBeVisible()
})

test('dropping a note on its current folder is a no-op', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('recipes/Pasta.md', '# Pasta'),
    createMockNote('recipes/Existing.md', '# Existing'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await page.locator('[data-navigation-id="folder:recipes"]').click()

  await dragNoteToNavigationTarget(page, 'recipes/Pasta.md', 'folder:recipes')

  await expect(noteRow(page, 'recipes/Pasta.md')).toBeVisible()
  await expect(noteRow(page, 'recipes/Pasta (2).md')).toHaveCount(0)
})

test('moves a note with a suffixed id when the target folder already has the same title', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('Pasta.md', '# Inbox pasta'),
    createMockNote('recipes/Pasta.md', '# Folder pasta'),
    createMockNote('recipes/Existing.md', '# Existing'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)

  await dragNoteToNavigationTarget(page, 'Pasta.md', 'folder:recipes')

  await expect(noteRow(page, 'Pasta.md')).toHaveCount(0)
  await page.locator('[data-navigation-id="folder:recipes"]').click()
  await expect(noteRow(page, 'recipes/Pasta.md')).toBeVisible()
  await expect(noteRow(page, 'recipes/Pasta (2).md')).toBeVisible()
})
