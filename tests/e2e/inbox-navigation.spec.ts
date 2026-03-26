import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import yaml from 'yaml'
import { createMockNote, mockNotesApi } from './helpers'

async function waitForNotesList(page: Page): Promise<void> {
  await expect(page.getByTestId('sidebar-navigation')).toBeVisible()
  await expect(page.getByTestId('notes-list')).toBeVisible()
}

function hexToCssColor(value: string): string {
  const normalized = value.replace('#', '')

  if (normalized.length !== 6 && normalized.length !== 8) {
    throw new Error(`Unsupported accentColor format: ${value}`)
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  if (normalized.length === 6) {
    return `rgb(${red}, ${green}, ${blue})`
  }

  const alpha = Number.parseInt(normalized.slice(6, 8), 16) / 255

  if (alpha === 1) {
    return `rgb(${red}, ${green}, ${blue})`
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

async function loadAccentColor(): Promise<string> {
  const rawConfig = await readFile(
    resolve(process.cwd(), 'app/config/default.yaml'),
    'utf-8',
  )
  const parsed = yaml.parse(rawConfig) as {
    theme?: { accentColor?: string }
  } | null

  if (typeof parsed?.theme?.accentColor !== 'string') {
    throw new Error('theme.accentColor is missing from app/config/default.yaml')
  }

  return parsed.theme.accentColor
}

test('shows Inbox as the default selected navigation item', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('root-note.md', '', '2026-03-25T12:00:00.000Z'),
    createMockNote('Work/task.md', '', '2026-03-24T12:00:00.000Z'),
  ])

  await page.goto('/')
  await waitForNotesList(page)

  await expect(
    page.locator('[data-navigation-id="inbox"]').first(),
  ).toHaveAttribute('data-selected', 'true')
})

test('filters the notes list to vault root notes by default', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('root-note.md', '', '2026-03-25T12:00:00.000Z'),
    createMockNote('Work/task.md', '', '2026-03-24T12:00:00.000Z'),
  ])

  await page.goto('/')
  await waitForNotesList(page)

  const noteIds = await page
    .getByTestId('notes-list-item')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-note-id') ?? ''),
    )

  expect(noteIds).toEqual(['root-note.md'])
})

test('uses theme accentColor and white text for the selected Inbox item', async ({
  page,
}) => {
  const accentColor = hexToCssColor(await loadAccentColor())

  await page.goto('/')
  await waitForNotesList(page)

  const inboxItem = page.locator('[data-navigation-id="inbox"]').first()

  await expect(inboxItem).toHaveCSS('background-color', accentColor)
  await expect(inboxItem).toHaveCSS('color', 'rgb(255, 255, 255)')
})

test('uses theme accentColor for the selected notes list item border', async ({
  page,
}) => {
  const accentColor = hexToCssColor(await loadAccentColor())

  await page.goto('/')
  await waitForNotesList(page)

  const selectedNote = page.getByTestId('notes-list-item').first()

  await expect(selectedNote).toBeVisible()
  await expect(selectedNote).toHaveAttribute('data-selected', 'true')
  await expect(selectedNote).toHaveCSS('border-left-color', accentColor)
})

test('selects a top-level folder and shows only its direct child notes', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('root-note.md', '', '2026-03-25T12:00:00.000Z'),
    createMockNote('Work/latest.md', '', '2026-03-24T12:00:00.000Z'),
    createMockNote('Work/archive/older.md', '', '2026-03-23T12:00:00.000Z'),
    createMockNote('Work/earlier.md', '', '2026-03-22T12:00:00.000Z'),
    createMockNote('Travel/checklist.md', '', '2026-03-21T12:00:00.000Z'),
  ])

  await page.goto('/')
  await waitForNotesList(page)

  await page.locator('[data-navigation-id="folder:Work"]').first().click()

  const noteIds = await page
    .getByTestId('notes-list-item')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-note-id') ?? ''),
    )

  expect(noteIds).toEqual(['Work/latest.md', 'Work/earlier.md'])
})

test('deselects Inbox when a folder is selected', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('root-note.md', '', '2026-03-25T12:00:00.000Z'),
    createMockNote('Work/task.md', '', '2026-03-24T12:00:00.000Z'),
  ])

  await page.goto('/')
  await waitForNotesList(page)

  await page.locator('[data-navigation-id="folder:Work"]').first().click()

  await expect(
    page.locator('[data-navigation-id="inbox"]').first(),
  ).toHaveAttribute('data-selected', 'false')
})
