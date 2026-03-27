import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import type { Note, NoteProperties } from '../../app/notes/types'

const FIXTURE_NOTE_PROPERTY_TITLE = 'Second note (test seed)'

function buildNoteContentPath(id: string): string {
  return `/api/notes/${id.split('/').map(encodeURIComponent).join('/')}`
}

function getNoteProperties(note: Note): NoteProperties {
  const {
    id: _id,
    content: _content,
    createdAt: _createdAt,
    modifiedAt: _modifiedAt,
    title: _title,
    description: _description,
    ...properties
  } = note

  return properties
}

async function loadFixtureNote(request: APIRequestContext): Promise<Note> {
  const response = await request.get('/api/notes')

  expect(response.ok()).toBeTruthy()

  const notes = (await response.json()) as Note[]
  const note =
    notes.find(
      (entry) =>
        entry.title === FIXTURE_NOTE_PROPERTY_TITLE && !entry.id.includes('/'),
    ) ?? notes.find((entry) => !entry.id.includes('/'))

  expect(note).toBeDefined()

  const noteResponse = await request.get(buildNoteContentPath(note!.id))

  expect(noteResponse.ok()).toBeTruthy()

  return (await noteResponse.json()) as Note
}

async function restoreNote(
  request: APIRequestContext,
  note: Note,
): Promise<void> {
  const response = await request.put('/api/notes', {
    data: {
      id: note.id,
      content: note.content,
      properties: getNoteProperties(note),
    },
  })

  expect(response.ok()).toBeTruthy()
}

async function waitForEditorReady(page: Page): Promise<void> {
  await expect(page.getByTestId('note-editor-error')).toHaveCount(0, {
    timeout: 15000,
  })
  await expect(page.getByTestId('note-editor-loading')).toHaveCount(0, {
    timeout: 15000,
  })
  await expect(page.locator('.ce-block').first()).toBeVisible({
    timeout: 15000,
  })
}

async function openNote(page: Page, id: string): Promise<void> {
  const noteButton = page.locator(`[data-note-id="${id}"]`)

  await noteButton.click()
  await expect(noteButton).toHaveAttribute('data-selected', 'true')
  await waitForEditorReady(page)
}

function firstBodyParagraph(page: Page) {
  return page.locator('.ce-paragraph').filter({ hasText: /\S/ }).first()
}

async function appendMarkerToFirstParagraph(
  page: Page,
  marker: string,
): Promise<void> {
  const paragraph = firstBodyParagraph(page)

  await paragraph.evaluate((element) => {
    const range = document.createRange()
    const selection = window.getSelection()

    range.selectNodeContents(element)
    range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)
    ;(element as HTMLElement).focus()
  })

  await page.keyboard.type(` ${marker}`)
  await expect(paragraph).toContainText(marker)
}

test('persists editor changes after autosave and survives a reload', async ({
  page,
  request,
}) => {
  const marker = `autosave-saved-${Date.now()}`
  const originalNote = await loadFixtureNote(request)

  try {
    await page.goto('/')
    await openNote(page, originalNote.id)
    await appendMarkerToFirstParagraph(page, marker)

    await expect
      .poll(async () => (await loadFixtureNote(request)).content, {
        timeout: 10000,
      })
      .toContain(marker)
    await page.reload()
    await openNote(page, originalNote.id)
    await expect(firstBodyParagraph(page)).toBeVisible({ timeout: 10000 })

    await expect(firstBodyParagraph(page)).toContainText(marker)
  } finally {
    await restoreNote(request, originalNote)
  }
})
