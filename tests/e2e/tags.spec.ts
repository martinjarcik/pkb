import { expect, test, type Page } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

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

test('extracts tags on save and keeps hashtags in content', async ({
  page,
}) => {
  const api = await mockNotesApi(page, [
    createMockNote('first-note.md', 'First paragraph.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await appendToFirstParagraph(page, ' #engineering #idea')

  await expect
    .poll(() => api.getNote('first-note.md'), {
      timeout: 10000,
    })
    .toMatchObject({
      id: 'first-note.md',
      content: 'First paragraph. #engineering #idea',
      tags: ['engineering', 'idea'],
    })

  await expect(page.locator('.ce-paragraph').first()).toContainText(
    '#engineering #idea',
  )
  await expect(page.getByTestId('sidebar-tag-item')).toHaveCount(2)
})

test('lists tags in the sidebar and filters notes by selected tags', async ({
  page,
}) => {
  await mockNotesApi(page, [
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

  await engineeringTag.click()

  await expect(engineeringTag).toHaveAttribute('data-state', 'active')
  await expect(engineeringTag).toHaveCSS('color', 'rgb(63, 87, 223)')
  await expect(page.getByTestId('notes-list-item')).toHaveCount(2)

  await page.locator('[data-navigation-id="inbox"]').click()

  await expect(engineeringTag).toHaveAttribute('data-state', 'idle')
  await expect(page.getByTestId('notes-list-item')).toHaveCount(3)
})

test('cycles tag through active, pinned, and idle states', async ({ page }) => {
  await mockNotesApi(page, [
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

  const engineeringTag = page.locator('[data-tag="engineering"]')
  const ideaTag = page.locator('[data-tag="idea"]')

  await engineeringTag.click()
  await expect(engineeringTag).toHaveAttribute('data-state', 'active')

  await engineeringTag.click()
  await expect(engineeringTag).toHaveAttribute('data-state', 'pinned')

  await ideaTag.click()
  await expect(ideaTag).toHaveAttribute('data-state', 'active')
  await expect(engineeringTag).toHaveAttribute('data-state', 'pinned')
  await expect(page.getByTestId('notes-list-item')).toHaveCount(1)
  await expect(page.locator('[data-note-id="a.md"]')).toBeVisible()

  await engineeringTag.click()
  await expect(engineeringTag).toHaveAttribute('data-state', 'idle')
  await expect(ideaTag).toHaveAttribute('data-state', 'active')
})

test('pinned tag is displayed in bold', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('a.md', 'Alpha note.', FIXED_TIMESTAMP, {
      tags: ['engineering'],
    }),
  ])

  await page.goto('/')

  const engineeringTag = page.locator('[data-tag="engineering"]')

  await engineeringTag.click()
  await expect(engineeringTag).not.toHaveCSS('font-weight', '700')

  await engineeringTag.click()
  await expect(engineeringTag).toHaveCSS('font-weight', '700')

  await engineeringTag.click()
  await expect(engineeringTag).not.toHaveCSS('font-weight', '700')
})

test('clicking a new tag replaces the previously active tag', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('a.md', 'Alpha note.', FIXED_TIMESTAMP, {
      tags: ['engineering', 'idea'],
    }),
    createMockNote('b.md', 'Beta note.', FIXED_TIMESTAMP, {
      tags: ['dream'],
    }),
  ])

  await page.goto('/')

  const engineeringTag = page.locator('[data-tag="engineering"]')
  const ideaTag = page.locator('[data-tag="idea"]')

  await engineeringTag.click()
  await expect(engineeringTag).toHaveAttribute('data-state', 'active')

  await ideaTag.click()
  await expect(ideaTag).toHaveAttribute('data-state', 'active')
  await expect(engineeringTag).toHaveAttribute('data-state', 'idle')
})

test('unpinning the last tag returns to inbox', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('a.md', 'Alpha note.', FIXED_TIMESTAMP, {
      tags: ['engineering'],
    }),
    createMockNote('b.md', 'Beta note.', FIXED_TIMESTAMP),
  ])

  await page.goto('/')

  const engineeringTag = page.locator('[data-tag="engineering"]')

  await engineeringTag.click()
  await engineeringTag.click()
  await expect(engineeringTag).toHaveAttribute('data-state', 'pinned')

  await engineeringTag.click()
  await expect(engineeringTag).toHaveAttribute('data-state', 'idle')
  await expect(page.getByTestId('notes-list-item')).toHaveCount(2)
})

test('renders sidebar tags with the hash prefix', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('first-note.md', 'Tagged note.', FIXED_TIMESTAMP, {
      tags: ['engineering'],
    }),
  ])

  await page.goto('/')

  await expect(page.getByTestId('sidebar-tag-item')).toHaveText([
    '#engineering',
  ])
})

test('tags chevron is always visible and collapses the tag list', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('first-note.md', 'Tagged note.', FIXED_TIMESTAMP, {
      tags: ['engineering', 'idea'],
    }),
  ])

  await page.goto('/')

  const controls = page.getByTestId('sidebar-tags-controls')

  await expect(controls).toBeVisible()
  await expect(page.getByTestId('sidebar-tags-toggle')).toBeVisible()
  await expect(page.getByTestId('sidebar-tags-list')).toBeVisible()

  await page.getByTestId('sidebar-tags-toggle').click()

  await expect(page.getByTestId('sidebar-tags-list')).toHaveCount(0)

  await page.getByTestId('sidebar-tags-toggle').click()

  await expect(page.getByTestId('sidebar-tags-list')).toBeVisible()
})

test('turns a typed hashtag into an inline hashtag span after space', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('first-note.md', 'First paragraph.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await appendToFirstParagraph(page, ' #engineering ')

  await expect(page.locator('.inline-hashtag').first()).toHaveText(
    '#engineering',
  )
})
