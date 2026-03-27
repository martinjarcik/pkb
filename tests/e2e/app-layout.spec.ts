import { expect, test, type Page } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

function buildAppLayoutNotes() {
  return [
    createMockNote('first-note.md', 'First paragraph.\n\nSecond paragraph.'),
    createMockNote('second-note.md', 'Second note body.'),
    createMockNote('heading-note.md', '## Heading two\n\nBody paragraph.'),
  ]
}

function visiblePopoverItems(page: Page) {
  return page.locator('.ce-popover-item:visible')
}

test.beforeEach(async ({ page }) => {
  await mockNotesApi(page, buildAppLayoutNotes())
})

test('renders the default application layout', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('sidebar-panel')).toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).toBeVisible()
  await expect(page.getByTestId('note-panel')).toBeVisible()
  await expect(page.getByTestId('inspector-panel')).toBeVisible()
})

test('renders loaded notes in the notes list', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('notes-list-item').first()).toBeVisible()
})

test('selects the first loaded note in the list', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('notes-list-item').first()).toHaveAttribute(
    'data-selected',
    'true',
  )
})

test('renders the first loaded note in the Editor.js surface', async ({
  page,
}) => {
  await page.goto('/')

  await waitForEditorReady(page)
})

test('shows the note title block in the editor', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await expect(page.getByTestId('note-title')).toBeVisible()
})

test('hides editor toolbar when hovering the note title', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await page.getByTestId('note-title').hover()

  await expect(page.locator('.ce-toolbar:visible')).toHaveCount(0)
})

test('hides editor settings when the note title is focused', async ({
  page,
}) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await page.getByTestId('note-title').click()

  await expect(page.locator('.ce-toolbar__settings-btn:visible')).toHaveCount(0)
})

test('does not keep title toolbar visible when another block gains focus', async ({
  page,
}) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await page.getByTestId('note-title').hover()
  await page
    .locator('.ce-paragraph')
    .first()
    .evaluate((element) => {
      ;(element as HTMLElement).focus()
    })

  await expect(page.locator('.ce-toolbar:visible')).toHaveCount(0)
  await expect(page.locator('.ce-toolbox:visible')).toHaveCount(0)
})

test('keeps the custom note title block first when moving the next block up', async ({
  page,
}) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await page.locator('.ce-paragraph').first().click()
  await page.locator('.ce-toolbar__settings-btn').first().click()
  await visiblePopoverItems(page).filter({ hasText: 'Move up' }).click()

  await expect(
    page.locator('.ce-block').first().locator('[data-testid="note-title"]'),
  ).toHaveCount(1)
})

test('updates the active note when a different list row is clicked', async ({
  page,
}) => {
  await page.goto('/')

  await waitForEditorReady(page)

  const firstNote = page.getByTestId('notes-list-item').first()
  const secondNote = page.getByTestId('notes-list-item').nth(1)

  await secondNote.click()

  await expect(secondNote).toHaveAttribute('data-selected', 'true')
  await expect(firstNote).toHaveAttribute('data-selected', 'false')
  await expect(page.locator('.ce-block')).not.toHaveCount(0)
})

test('shows block conversion options for a content block', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)
  const contentBlock = page.locator('.ce-paragraph').first()

  await expect(contentBlock).toBeVisible()

  await contentBlock.click()
  await page.locator('.ce-toolbar__settings-btn').first().click()

  await expect(visiblePopoverItems(page).first()).toBeVisible()
})
