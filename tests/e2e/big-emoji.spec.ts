import { expect, test, type Page, type Route } from '@playwright/test'
import { noteDescriptionFromContent } from '../../app/notes/noteDescriptionFromContent'
import type { Note, NoteProperties } from '../../app/notes/types'
import { createMockNote, waitForEditorReady } from './helpers'

test.describe.configure({ mode: 'serial' })

type SaveBody = {
  content: string
  id: string
  properties: NoteProperties
}

const FIXED_TIMESTAMP = '2026-03-26T12:00:00.000Z'

function firstParagraph(page: Page) {
  return page.locator('.ce-paragraph').filter({ hasText: /\S/ }).first()
}

function bigEmojiToolbarButton(page: Page) {
  return page.locator(
    '.ce-inline-toolbar button[aria-label="Big Emoji"]:visible',
  )
}

function emojiPickerInActions(page: Page) {
  return page.locator('.big-emoji-actions emoji-picker')
}

async function expectBigEmojiPickerOpen(page: Page): Promise<void> {
  const picker = page.locator('.big-emoji-actions')

  await expect(picker).toBeVisible()
  await expect(emojiPickerInActions(page)).toBeVisible()

  const box = await picker.boundingBox()

  expect(box?.width ?? 0).toBeGreaterThan(0)
  expect(box?.height ?? 0).toBeGreaterThan(0)
}

async function selectTextInFirstParagraph(
  page: Page,
  selectedText: string,
): Promise<void> {
  await expect(firstParagraph(page)).toBeVisible({ timeout: 10000 })

  await firstParagraph(page).evaluate((element, targetText) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let currentNode = walker.nextNode()

    while (currentNode) {
      const textNode = currentNode as Text
      const index = textNode.data.indexOf(targetText)

      if (index >= 0) {
        const range = document.createRange()
        const selection = window.getSelection()

        range.setStart(textNode, index)
        range.setEnd(textNode, index + targetText.length)
        selection?.removeAllRanges()
        selection?.addRange(range)
        ;(element as HTMLElement).focus()
        return
      }

      currentNode = walker.nextNode()
    }

    throw new Error(`Could not find text: ${targetText}`)
  }, selectedText)

  await expect(bigEmojiToolbarButton(page)).toHaveCount(1)
}

async function mockNotesApi(
  page: Page,
  initialNotes: Note[],
): Promise<{ getLastSaveBody: () => SaveBody | null }> {
  let notes = [...initialNotes]
  let lastSaveBody: SaveBody | null = null

  await page.route('**/api/folders', async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  await page.route(
    (url) => {
      const pathname = new URL(url).pathname

      return pathname === '/api/notes' || pathname.startsWith('/api/notes/')
    },
    async (route: Route) => {
      const pathname = new URL(route.request().url()).pathname
      const method = route.request().method()

      if (pathname === '/api/notes' || pathname === '/api/notes/') {
        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(notes),
          })
          return
        }

        if (method === 'PUT') {
          const body = route.request().postDataJSON() as SaveBody
          const noteIndex = notes.findIndex((note) => note.id === body.id)

          lastSaveBody = body

          if (noteIndex >= 0) {
            const updatedNote = {
              ...notes[noteIndex]!,
              ...body.properties,
              content: body.content,
              modifiedAt: FIXED_TIMESTAMP,
              description: noteDescriptionFromContent(body.content),
            }

            notes = notes.map((note, index) =>
              index === noteIndex ? updatedNote : note,
            )

            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(updatedNote),
            })
            return
          }
        }

        await route.fallback()
        return
      }

      if (method === 'GET') {
        const noteId = pathname
          .replace(/^\/api\/notes\//, '')
          .split('/')
          .map((segment) => decodeURIComponent(segment))
          .join('/')
        const note = notes.find((entry) => entry.id === noteId)

        if (!note) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ statusMessage: 'Note not found' }),
          })
          return
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(note),
        })
        return
      }

      await route.fallback()
    },
  )

  return {
    getLastSaveBody: () => lastSaveBody,
  }
}

async function clickEmojiInPicker(page: Page, emoji: string): Promise<void> {
  await emojiPickerInActions(page)
    .getByRole('button', { name: emoji })
    .first()
    .click()
}

test('inserts big emoji inline and persists bold emoji markdown', async ({
  page,
}) => {
  const api = await mockNotesApi(page, [
    createMockNote('first-note.md', 'Alpha beta gamma.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await selectTextInFirstParagraph(page, 'beta')
  await bigEmojiToolbarButton(page).click()
  await expectBigEmojiPickerOpen(page)
  await clickEmojiInPicker(page, '😀')
  await expect(page.locator('.big-emoji-actions')).toBeHidden()
  await page.keyboard.type('!')

  await expect(firstParagraph(page).locator('.inline-big-emoji')).toHaveText(
    '😀',
  )
  await expect(firstParagraph(page).locator('.inline-big-emoji')).toHaveCount(1)
  await expect
    .poll(() => api.getLastSaveBody()?.content, {
      timeout: 10000,
    })
    .toBe('Alpha __😀__! gamma.')

  await page.reload()
  await waitForEditorReady(page)

  await expect(firstParagraph(page).locator('.inline-big-emoji')).toHaveText(
    '😀',
  )
  await expect(firstParagraph(page)).toContainText('Alpha 😀! gamma.')
})

test('clicks an existing big emoji to replace it', async ({ page }) => {
  const api = await mockNotesApi(page, [
    createMockNote('first-note.md', 'Alpha **😀** gamma.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await firstParagraph(page).locator('.inline-big-emoji').click()
  await expectBigEmojiPickerOpen(page)
  await clickEmojiInPicker(page, '😂')
  await expect(page.locator('.big-emoji-actions')).toBeHidden()

  await expect(firstParagraph(page).locator('.inline-big-emoji')).toHaveText(
    '😂',
  )
  await expect
    .poll(() => api.getLastSaveBody()?.content, {
      timeout: 10000,
    })
    .toBe('Alpha __😂__ gamma.')
})

test('searches within the big emoji picker', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('first-note.md', 'Alpha beta gamma.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await selectTextInFirstParagraph(page, 'beta')
  await bigEmojiToolbarButton(page).click()
  await expectBigEmojiPickerOpen(page)

  const search = emojiPickerInActions(page).getByRole('searchbox')

  await search.click()
  await search.fill('grinning')
  await expect(
    emojiPickerInActions(page)
      .getByRole('button', { name: /grinning/i })
      .first(),
  ).toBeVisible()
})
