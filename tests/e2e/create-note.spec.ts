import { expect, test, type Page, type Route } from '@playwright/test'
import type { Note } from '~/notes/types'

const FIXED_TIMESTAMP = '2026-03-25T12:00:00.000Z'

function createMockNote(id: string, content: string = ''): Note {
  return {
    id,
    content,
    createdAt: FIXED_TIMESTAMP,
    modifiedAt: FIXED_TIMESTAMP,
  }
}

async function waitForEditorReady(page: Page): Promise<void> {
  await expect(page.getByTestId('note-editor-error')).toHaveCount(0, {
    timeout: 15000,
  })
  await expect(page.getByTestId('note-editor-loading')).toHaveCount(0, {
    timeout: 15000,
  })
}

async function mockNotesApi(page: Page, initialNotes: Note[]): Promise<void> {
  let notes = [...initialNotes]

  await page.route('**/api/notes', async (route: Route) => {
    const method = route.request().method()

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(notes),
      })

      return
    }

    if (method === 'PUT') {
      const body = route.request().postDataJSON() as {
        id: string
        content: string
      }
      const createdNote = createMockNote(body.id, body.content)

      notes = [createdNote, ...notes]

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createdNote),
      })

      return
    }

    await route.fallback()
  })
}

test('creates a new note at the top of the list and focuses its title', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('existing.md', '# Existing\n\nExisting content'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)

  await page.getByTestId('notes-list-create-note').click()

  const firstNote = page.getByTestId('notes-list-item').first()
  const noteTitle = page.getByTestId('note-title')

  await expect(firstNote).toHaveAttribute('data-note-id', 'New Note.md')
  await expect(firstNote).toHaveAttribute('data-selected', 'true')
  await expect(page.getByTestId('notes-list-item-title').first()).toHaveText(
    'New Note',
  )
  await expect(noteTitle).toHaveText('New Note')
  await expect(noteTitle).toBeFocused()
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

test('creates and loads the first note when the list is empty', async ({
  page,
}) => {
  await mockNotesApi(page, [])

  await page.goto('/')
  await expect(page.getByTestId('notes-list-empty')).toBeVisible()
  await waitForEditorReady(page)

  await page.getByTestId('notes-list-create-note').click()

  const firstNote = page.getByTestId('notes-list-item').first()
  const noteTitle = page.getByTestId('note-title')

  await expect(firstNote).toHaveAttribute('data-note-id', 'New Note.md')
  await expect(firstNote).toHaveAttribute('data-selected', 'true')
  await expect(page.getByTestId('notes-list-item-title').first()).toHaveText(
    'New Note',
  )
  await expect(noteTitle).toHaveText('New Note')
  await expect(noteTitle).toBeFocused()
})
