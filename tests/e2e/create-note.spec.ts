import { expect, test } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

test('creates a new note at the top of the list', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('existing.md', '# Existing\n\nExisting content'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)

  await page.getByTestId('notes-list-create-note').click()

  await expect(page.getByTestId('notes-list-item').first()).toHaveAttribute(
    'data-note-id',
    'New Note.md',
  )
})

test('selects and opens the newly created note', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('existing.md', '# Existing\n\nExisting content'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)

  await page.getByTestId('notes-list-create-note').click()

  await expect(page.getByTestId('notes-list-item').first()).toHaveAttribute(
    'data-selected',
    'true',
  )
  await expect(page.getByTestId('note-title')).toHaveText('New Note')
})

test('creates a suffixed note title when New Note already exists', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('New Note.md', '# Existing new note'),
    createMockNote('existing.md', '# Existing'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)

  await page.getByTestId('notes-list-create-note').click()

  await expect(page.getByTestId('notes-list-item').first()).toHaveAttribute(
    'data-note-id',
    'New Note (2).md',
  )
  await expect(page.getByTestId('notes-list-item-title').first()).toHaveText(
    'New Note (2)',
  )
})

test('creates the first note when the list is empty', async ({ page }) => {
  await mockNotesApi(page, [])

  await page.goto('/')
  await expect(page.getByTestId('notes-list-empty')).toBeVisible()
  await waitForEditorReady(page)

  await page.getByTestId('notes-list-create-note').click()

  await expect(page.getByTestId('notes-list-item').first()).toHaveAttribute(
    'data-note-id',
    'New Note.md',
  )
  await expect(page.getByTestId('note-title')).toHaveText('New Note')
})

test('creates a new note inside the selected folder view', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('Work/existing.md', '# Existing\n\nExisting content'),
    createMockNote('Personal/note.md', '# Personal'),
    createMockNote('root.md', '# Root'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)

  await page.locator('[data-navigation-id="folder:Work"]').click()
  await page.getByTestId('notes-list-create-note').click()

  await expect(page.getByTestId('notes-list-item').first()).toHaveAttribute(
    'data-note-id',
    'Work/New Note.md',
  )
})

test('renames the selected note when the title loses focus', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('existing.md', '# Existing\n\nExisting content'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)

  const noteTitle = page.getByTestId('note-title')

  await noteTitle.evaluate((element) => {
    const range = document.createRange()
    const selection = window.getSelection()

    range.selectNodeContents(element)
    selection?.removeAllRanges()
    selection?.addRange(range)
    ;(element as HTMLElement).focus()
  })
  await page.keyboard.type('Renamed Note')
  await page.locator('.ce-paragraph').first().click()

  await expect(page.getByTestId('notes-list-item').first()).toHaveAttribute(
    'data-note-id',
    'Renamed Note.md',
  )
  await expect(page.getByTestId('notes-list-item-title').first()).toHaveText(
    'Renamed Note',
  )
})
