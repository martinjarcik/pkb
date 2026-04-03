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

async function waitForNotesListItems(page: Page): Promise<void> {
  await expect(page.getByTestId('notes-list-item').first()).toBeVisible({
    timeout: 10000,
  })
}

async function mockDefaultAppLayoutApi(page: Page): Promise<void> {
  await mockNotesApi(page, buildAppLayoutNotes())
}

test('renders the default application layout', async ({ page }) => {
  await mockDefaultAppLayoutApi(page)
  await page.goto('/')
  await waitForEditorReady(page)

  await expect(page.getByTestId('sidebar-panel')).toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).toBeVisible()
  await expect(page.getByTestId('note-panel')).toBeVisible()
  await expect(page.getByTestId('inspector-panel')).toBeVisible()
})

test('renders loaded notes in the notes list', async ({ page }) => {
  await mockDefaultAppLayoutApi(page)
  await page.goto('/')
  await waitForNotesListItems(page)
})

test('selects the first loaded note in the list', async ({ page }) => {
  await mockDefaultAppLayoutApi(page)
  await page.goto('/')
  await waitForNotesListItems(page)

  await expect(page.getByTestId('notes-list-item').first()).toHaveAttribute(
    'data-selected',
    'true',
  )
})

test('renders the first loaded note in the Editor.js surface', async ({
  page,
}) => {
  await mockDefaultAppLayoutApi(page)
  await page.goto('/')

  await waitForEditorReady(page)
})

test('loads the full note body from the initial vault read', async ({
  page,
}) => {
  await mockNotesApi(
    page,
    [
      createMockNote(
        'first-note.md',
        'First paragraph.\n\nSecond paragraph.\n\nFull content from vault read.',
      ),
    ],
    { readAllNotesDelayMs: 250 },
  )

  await page.goto('/')
  await waitForEditorReady(page)

  await expect(page.locator('.ce-paragraph')).toContainText([
    'First paragraph.',
    'Second paragraph.',
    'Full content from vault read.',
  ])
})

test('renders the selected note content after clicking a different list row', async ({
  page,
}) => {
  await mockDefaultAppLayoutApi(page)
  await page.goto('/')
  await waitForEditorReady(page)
  await page.getByTestId('notes-list-item').nth(1).click()

  await expect(page.locator('.ce-paragraph')).toContainText([
    'Second note body.',
  ])
})

test('shows the note title block in the editor', async ({ page }) => {
  await mockDefaultAppLayoutApi(page)
  await page.goto('/')
  await waitForEditorReady(page)

  await expect(page.getByTestId('note-title')).toBeVisible()
})

test('hides editor toolbar when hovering the note title', async ({ page }) => {
  await mockDefaultAppLayoutApi(page)
  await page.goto('/')
  await waitForEditorReady(page)

  await page.getByTestId('note-title').hover()

  await expect(page.locator('.ce-toolbar:visible')).toHaveCount(0)
})

test('hides editor settings when the note title is focused', async ({
  page,
}) => {
  await mockDefaultAppLayoutApi(page)
  await page.goto('/')
  await waitForEditorReady(page)

  await page.getByTestId('note-title').click()

  await expect(page.locator('.ce-toolbar__settings-btn:visible')).toHaveCount(0)
})

test('does not keep title toolbar visible when another block gains focus', async ({
  page,
}) => {
  await mockDefaultAppLayoutApi(page)
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
  await mockDefaultAppLayoutApi(page)
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
  await mockDefaultAppLayoutApi(page)
  await page.goto('/')

  await waitForEditorReady(page)

  const firstNote = page.getByTestId('notes-list-item').first()
  const secondNote = page.getByTestId('notes-list-item').nth(1)

  await secondNote.click()

  await expect(secondNote).toHaveAttribute('data-selected', 'true')
  await expect(firstNote).toHaveAttribute('data-selected', 'false')
  await expect(page.locator('.ce-block')).not.toHaveCount(0)
})

test('clicking a note does not update modifiedAt or move it to the top', async ({
  page,
}) => {
  const api = await mockNotesApi(page, [
    createMockNote('newer.md', 'Newer note.', '2026-03-24T12:00:00.000Z'),
    createMockNote('older.md', 'Older note.', '2026-03-23T12:00:00.000Z'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)

  const olderBefore = api.getNote('older.md')?.modifiedAt

  await page.locator('[data-note-id="older.md"]').click()

  await expect(page.getByTestId('notes-list-item').first()).toHaveAttribute(
    'data-note-id',
    'newer.md',
  )
  await expect(api.getNote('older.md')?.modifiedAt).toBe(olderBefore)
})

test('shows block conversion options for a content block', async ({ page }) => {
  await mockDefaultAppLayoutApi(page)
  await page.goto('/')
  await waitForEditorReady(page)
  const contentBlock = page.locator('.ce-paragraph').first()

  await expect(contentBlock).toBeVisible()

  await contentBlock.click()
  await page.locator('.ce-toolbar__settings-btn').first().click()

  await expect(visiblePopoverItems(page).first()).toBeVisible()
})
