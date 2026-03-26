import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import type { Note, NoteProperties } from '~/notes/types'

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
  const note =
    notes.find(
      (entry) =>
        entry.title === FIXTURE_NOTE_PROPERTY_TITLE && !entry.id.includes('/'),
    ) ?? notes.find((entry) => !entry.id.includes('/'))

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

  await expect(firstBodyParagraph(page)).not.toContainText(marker)
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

    await expect(firstBodyParagraph(page)).toContainText(marker)
  } finally {
    await restoreNote(request, originalNote)
  }
})

test('preserves headings between checklists after save and reload', async ({
  page,
  request,
}) => {
  const originalNote = await loadFixtureNote(request)
  const checklistMarkdown = [
    '## Section A',
    '- [ ] task one',
    '- [x] task two',
    '## Section B',
    '- [ ] task three',
    '- [ ] task four',
    '## Section C',
    '- [x] task five',
    '- [ ] task six',
  ].join('\n')

  await request.put('/api/notes', {
    data: {
      id: originalNote.id,
      content: checklistMarkdown,
      properties: getNoteProperties(originalNote),
    },
  })

  try {
    await page.goto('/')
    await openNote(page, originalNote.id)

    await expect(page.locator('.ce-header')).toHaveCount(3)
    await expect(page.locator('.cdx-list__item')).toHaveCount(6)

    const firstItemContent = page.locator('.cdx-list__item-content').first()
    await firstItemContent.click()
    await page.keyboard.type(' edited')
    await page.waitForTimeout(2500)

    await page.reload()
    await waitForEditorReady(page)

    await expect(page.locator('.ce-header')).toHaveCount(3, { timeout: 3000 })
    await expect(page.locator('.cdx-list__item')).toHaveCount(6, {
      timeout: 3000,
    })

    const savedNote = await loadFixtureNote(request)

    expect(savedNote.content).toBe(
      [
        '## Section A',
        '- [ ] task one edited',
        '- [x] task two',
        '## Section B',
        '- [ ] task three',
        '- [ ] task four',
        '## Section C',
        '- [x] task five',
        '- [ ] task six',
      ].join('\n'),
    )
  } finally {
    await restoreNote(request, originalNote)
  }
})

test('saves the custom note title block and moves Enter into the body', async ({
  page,
  request,
}) => {
  const originalNote = await loadFixtureNote(request)
  const bodyMarker = `title-body-${Date.now()}`

  try {
    await page.goto('/')
    await openNote(page, originalNote.id)

    const noteTitle = page.getByTestId('note-title')
    const paragraphCountBefore = await page.locator('.ce-paragraph').count()

    await noteTitle.click()
    await page.keyboard.press('Enter')

    const firstParagraph = page.locator('.ce-paragraph').first()
    await expect(page.locator('.ce-paragraph')).toHaveCount(
      paragraphCountBefore + 1,
    )
    await expect(firstParagraph).toBeFocused()

    await page.keyboard.type(bodyMarker)
    await expect(firstParagraph).toHaveText(bodyMarker)

    await page.waitForTimeout(2500)

    const savedNote = await loadFixtureNote(request)

    expect(savedNote.content).toContain(bodyMarker)
    expect(savedNote.content.startsWith(bodyMarker)).toBe(true)
  } finally {
    await restoreNote(request, originalNote)
  }
})
