import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import type { Note, NoteProperties } from '~/notes/types'
import { noteTitleFromId } from '~/notes/noteTitleFromId'

const FIXTURE_NOTE_PROPERTY_TITLE = 'Second note (test seed)'

function getNoteProperties(note: Note): NoteProperties {
  const {
    id: _id,
    content: _content,
    createdAt: _createdAt,
    modifiedAt: _modifiedAt,
    ...properties
  } = note

  return properties
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

async function loadFixtureNote(request: APIRequestContext): Promise<Note> {
  const response = await request.get('/api/notes')

  expect(response.ok()).toBeTruthy()

  const notes = (await response.json()) as Note[]
  const note = notes.find(
    (entry) => entry.title === FIXTURE_NOTE_PROPERTY_TITLE,
  )

  expect(note).toBeDefined()

  return note!
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

async function renameNote(
  request: APIRequestContext,
  id: string,
  title: string,
): Promise<Note> {
  const response = await request.patch('/api/notes', {
    data: {
      id,
      title,
    },
  })

  expect(response.ok()).toBeTruthy()

  return (await response.json()) as Note
}

async function openNote(page: Page, id: string): Promise<void> {
  const noteButton = page.locator(`[data-note-id="${id}"]`)

  await noteButton.click()
  await expect(noteButton).toHaveAttribute('data-selected', 'true')
  await waitForEditorReady(page)
}

async function appendMarkerToFirstParagraph(
  page: Page,
  marker: string,
): Promise<void> {
  const paragraph = page.locator('.ce-paragraph').first()

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

test.describe.configure({ mode: 'serial' })

test('discards editor changes if the page reloads before 2 seconds', async ({
  page,
  request,
}) => {
  const note = await loadFixtureNote(request)
  const marker = `autosave-pending-${Date.now()}`

  await page.goto('/')
  await openNote(page, note.id)
  await appendMarkerToFirstParagraph(page, marker)

  await page.waitForTimeout(1000)
  await page.reload()
  await openNote(page, note.id)

  await expect(page.locator('.ce-paragraph').first()).not.toContainText(marker)
})

test('persists editor changes after 2 seconds of idle time', async ({
  page,
  request,
}) => {
  const marker = `autosave-saved-${Date.now()}`
  const originalNote = await loadFixtureNote(request)

  try {
    await page.goto('/')
    await openNote(page, originalNote.id)
    await appendMarkerToFirstParagraph(page, marker)

    await page.waitForTimeout(2500)
    await page.reload()
    await openNote(page, originalNote.id)

    await expect(page.locator('.ce-paragraph').first()).toContainText(marker)
  } finally {
    await restoreNote(request, originalNote)
  }
})

test('renames the note title on Enter and blur', async ({ page, request }) => {
  const originalNote = await loadFixtureNote(request)
  const originalTitle = noteTitleFromId(originalNote.id)
  const renamedTitle = `Renamed note ${Date.now()}`
  let currentId = originalNote.id

  try {
    await page.goto('/')
    await openNote(page, currentId)

    const noteTitle = page.getByTestId('note-title')

    await noteTitle.click()
    await noteTitle.fill(renamedTitle)
    await page.keyboard.press('Enter')

    currentId = `${renamedTitle}.md`

    await expect(noteTitle).toHaveText(renamedTitle)
    await expect(page.locator(`[data-note-id="${currentId}"]`)).toHaveAttribute(
      'data-selected',
      'true',
    )

    await noteTitle.click()
    await noteTitle.fill(originalTitle)
    await page.locator('.ce-paragraph').first().click()

    currentId = originalNote.id

    await expect(noteTitle).toHaveText(originalTitle)
    await expect(page.locator(`[data-note-id="${currentId}"]`)).toHaveAttribute(
      'data-selected',
      'true',
    )
  } finally {
    if (currentId !== originalNote.id) {
      await renameNote(request, currentId, originalTitle)
    }
  }
})
