import { expect, test, type Page, type Route } from '@playwright/test'
import { noteDescriptionFromContent } from '../../app/notes/noteDescriptionFromContent'
import type { Note, NoteProperties } from '../../app/notes/types'
import { createMockNote, waitForEditorReady } from './helpers'

type SaveBody = {
  id: string
  content: string
  properties: NoteProperties
}

const FIXED_TIMESTAMP = '2026-03-26T12:00:00.000Z'

async function appendToFirstParagraph(page: Page, text: string): Promise<void> {
  const paragraph = page
    .locator('.ce-paragraph')
    .filter({ hasText: /\S/ })
    .first()

  await paragraph.evaluate((element) => {
    const range = document.createRange()
    const selection = window.getSelection()

    range.selectNodeContents(element)
    range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)
    ;(element as HTMLElement).focus()
  })

  await page.keyboard.type(text)
}

async function mockTagNotesApi(
  page: Page,
  initialNotes: Note[],
): Promise<{ getLastSaveBody: () => SaveBody | null }> {
  let notes = [...initialNotes]
  let lastSaveBody: SaveBody | null = null

  await page.route('**/api/notes/**', async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    const pathname = new URL(route.request().url()).pathname
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
  })

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
  })

  return {
    getLastSaveBody: () => lastSaveBody,
  }
}

test('extracts tags on save and keeps hashtags in content', async ({
  page,
}) => {
  const api = await mockTagNotesApi(page, [
    createMockNote('first-note.md', 'First paragraph.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await appendToFirstParagraph(page, ' #engineering #idea')

  await expect
    .poll(() => api.getLastSaveBody(), {
      timeout: 10000,
    })
    .toMatchObject({
      id: 'first-note.md',
      content: 'First paragraph. #engineering #idea',
      properties: {
        tags: ['engineering', 'idea'],
      },
    })

  await expect(page.locator('.ce-paragraph').first()).toContainText(
    '#engineering #idea',
  )
  await expect(page.getByTestId('sidebar-tag-item')).toHaveCount(2)
})

test('lists tags in the sidebar and filters notes by selected tags', async ({
  page,
}) => {
  await mockTagNotesApi(page, [
    createMockNote('a.md', 'Alpha note.', FIXED_TIMESTAMP, {
      tags: ['engineering', 'idea'],
    }),
    createMockNote('b.md', 'Beta note.', FIXED_TIMESTAMP, {
      tags: ['engineering', 'dream'],
    }),
    createMockNote('c.md', 'Gamma note.', FIXED_TIMESTAMP, {
      tags: ['idea'],
    }),
  ])

  await page.goto('/')

  const tagItems = page.getByTestId('sidebar-tag-item')

  await expect(tagItems).toHaveCount(3)
  await expect(tagItems.nth(0)).toHaveText('#dream')
  await expect(tagItems.nth(1)).toHaveText('#engineering')
  await expect(tagItems.nth(2)).toHaveText('#idea')

  const engineeringTag = page.locator('[data-tag="engineering"]')
  const ideaTag = page.locator('[data-tag="idea"]')

  await engineeringTag.click()
  await ideaTag.click()

  await expect(engineeringTag).toHaveAttribute('data-selected', 'true')
  await expect(ideaTag).toHaveAttribute('data-selected', 'true')
  await expect(engineeringTag).toHaveCSS('color', 'rgb(63, 87, 223)')

  await expect(page.getByTestId('notes-list-item')).toHaveCount(1)
  await expect(page.locator('[data-note-id="a.md"]')).toBeVisible()

  await page.locator('[data-navigation-id="inbox"]').click()

  await expect(engineeringTag).toHaveAttribute('data-selected', 'false')
  await expect(ideaTag).toHaveAttribute('data-selected', 'false')
  await expect(page.getByTestId('notes-list-item')).toHaveCount(3)
})

test('renders sidebar tags with the hash prefix', async ({ page }) => {
  await mockTagNotesApi(page, [
    createMockNote('first-note.md', 'Tagged note.', FIXED_TIMESTAMP, {
      tags: ['engineering'],
    }),
  ])

  await page.goto('/')

  await expect(page.getByTestId('sidebar-tag-item')).toHaveText([
    '#engineering',
  ])
})

test('reveals tags chevron on hover and collapses the tag list', async ({
  page,
}) => {
  await mockTagNotesApi(page, [
    createMockNote('first-note.md', 'Tagged note.', FIXED_TIMESTAMP, {
      tags: ['engineering', 'idea'],
    }),
  ])

  await page.goto('/')

  const controls = page.getByTestId('sidebar-tags-controls')
  const actions = controls.locator('.sidebar-section-controls-actions')

  await expect(controls).toBeVisible()
  await expect(actions).toHaveCSS('opacity', '0')

  await controls.hover()

  await expect(actions).toHaveCSS('opacity', '1')
  await expect(page.getByTestId('sidebar-tags-list')).toBeVisible()

  await page.getByTestId('sidebar-tags-toggle').click()

  await expect(page.getByTestId('sidebar-tags-list')).toHaveCount(0)

  await controls.hover()
  await page.getByTestId('sidebar-tags-toggle').click()

  await expect(page.getByTestId('sidebar-tags-list')).toBeVisible()
})

test('turns a typed hashtag into an inline hashtag span after space', async ({
  page,
}) => {
  await mockTagNotesApi(page, [
    createMockNote('first-note.md', 'First paragraph.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await appendToFirstParagraph(page, ' #engineering ')

  await expect(page.locator('.inline-hashtag').first()).toHaveText(
    '#engineering',
  )
})
