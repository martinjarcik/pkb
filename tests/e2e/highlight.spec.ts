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

function highlightToolbarButton(page: Page) {
  return page.locator(
    '.ce-inline-toolbar button[aria-label="Highlight"]:visible',
  )
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

  await expect(highlightToolbarButton(page)).toHaveCount(1)
}

async function applyHighlight(page: Page): Promise<void> {
  await highlightToolbarButton(page).click()
}

async function pickHighlightColor(
  page: Page,
  colorName: string,
): Promise<void> {
  await page
    .locator(`.inline-highlight-action[aria-label="${colorName}"]:visible`)
    .first()
    .click()
}

async function mockHighlightNotesApi(
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

test('applies default highlight and saves == markdown', async ({ page }) => {
  const api = await mockHighlightNotesApi(page, [
    createMockNote('first-note.md', 'Alpha beta gamma.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await selectTextInFirstParagraph(page, 'beta')
  await applyHighlight(page)

  await expect(firstParagraph(page).locator('.inline-highlight')).toHaveText(
    'beta',
  )
  await expect(
    firstParagraph(page).locator('.inline-highlight'),
  ).toHaveAttribute('data-bg', 'yellow')

  await expect
    .poll(() => api.getLastSaveBody()?.content, {
      timeout: 10000,
    })
    .toBe('Alpha ==beta== gamma.')
})

test('changes highlight color and persists it after reload', async ({
  page,
}) => {
  const api = await mockHighlightNotesApi(page, [
    createMockNote('first-note.md', 'Alpha beta gamma.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await selectTextInFirstParagraph(page, 'beta')
  await applyHighlight(page)
  await pickHighlightColor(page, 'Red')

  const highlight = firstParagraph(page).locator('.inline-highlight')

  await expect(highlight).toHaveAttribute('data-bg', 'yellow')
  await expect(highlight).toHaveAttribute('data-text', 'red')
  await expect
    .poll(() => api.getLastSaveBody()?.content, {
      timeout: 10000,
    })
    .toBe('Alpha ==🟡🟡🔴beta== gamma.')

  await page.reload()
  await waitForEditorReady(page)

  await expect(firstParagraph(page).locator('.inline-highlight')).toHaveText(
    'beta',
  )
  await expect(
    firstParagraph(page).locator('.inline-highlight'),
  ).toHaveAttribute('data-bg', 'yellow')
  await expect(
    firstParagraph(page).locator('.inline-highlight'),
  ).toHaveAttribute('data-text', 'red')
})

test('toggles an active highlight off and removes markdown syntax on save', async ({
  page,
}) => {
  const api = await mockHighlightNotesApi(page, [
    createMockNote('first-note.md', 'Alpha ==beta== gamma.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await selectTextInFirstParagraph(page, 'beta')
  await applyHighlight(page)

  await expect(firstParagraph(page).locator('.inline-highlight')).toHaveCount(0)
  await expect
    .poll(() => api.getLastSaveBody()?.content, {
      timeout: 10000,
    })
    .toBe('Alpha beta gamma.')
})

test('clears an active highlight from the None picker option', async ({
  page,
}) => {
  const api = await mockHighlightNotesApi(page, [
    createMockNote('first-note.md', 'Alpha ==🔴beta== gamma.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await selectTextInFirstParagraph(page, 'beta')
  await pickHighlightColor(page, 'None')

  await expect(firstParagraph(page).locator('.inline-highlight')).toHaveCount(0)
  await expect
    .poll(() => api.getLastSaveBody()?.content, {
      timeout: 10000,
    })
    .toBe('Alpha beta gamma.')
})
