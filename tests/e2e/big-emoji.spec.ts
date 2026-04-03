import { expect, test, type Page } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

test.describe.configure({ mode: 'serial' })

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

async function clickEmojiInPicker(page: Page, emoji: string): Promise<void> {
  await emojiPickerInActions(page).evaluate((element, targetEmoji) => {
    element.dispatchEvent(
      new CustomEvent('emoji-click', {
        bubbles: true,
        detail: { unicode: targetEmoji },
      }),
    )
  }, emoji)
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
  await page.keyboard.type('!')

  await expect(firstParagraph(page).locator('.inline-big-emoji')).toHaveText(
    '😀',
  )
  await expect(firstParagraph(page).locator('.inline-big-emoji')).toHaveCount(1)
  await expect
    .poll(() => api.getNote('first-note.md')?.content, {
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
    .poll(() => api.getNote('first-note.md')?.content, {
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
  await emojiPickerInActions(page).evaluate((element) => {
    const search = element.shadowRoot?.querySelector('input[type="search"]')

    if (!(search instanceof HTMLInputElement)) {
      throw new Error('Could not find emoji picker search input')
    }

    search.focus()
    search.value = 'grinning'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    search.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect
    .poll(() =>
      emojiPickerInActions(page).evaluate((element) => {
        const buttons = Array.from(
          element.shadowRoot?.querySelectorAll('button') ?? [],
        )

        return buttons.some((button) => {
          const label =
            button.getAttribute('aria-label') ??
            button.getAttribute('title') ??
            button.textContent ??
            ''

          return /grinning/i.test(label)
        })
      }),
    )
    .toBe(true)
})
