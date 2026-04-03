import { expect, test, type Page } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

test.describe.configure({ mode: 'serial' })

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

test('applies default highlight and saves == markdown', async ({ page }) => {
  const api = await mockNotesApi(page, [
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
    .poll(() => api.getNote('first-note.md')?.content, {
      timeout: 10000,
    })
    .toBe('Alpha ==beta== gamma.')
})

test('changes highlight color and persists it after reload', async ({
  page,
}) => {
  const api = await mockNotesApi(page, [
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
    .poll(() => api.getNote('first-note.md')?.content, {
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
  const api = await mockNotesApi(page, [
    createMockNote('first-note.md', 'Alpha ==beta== gamma.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await selectTextInFirstParagraph(page, 'beta')
  await applyHighlight(page)

  await expect(firstParagraph(page).locator('.inline-highlight')).toHaveCount(0)
  await expect
    .poll(() => api.getNote('first-note.md')?.content, {
      timeout: 10000,
    })
    .toBe('Alpha beta gamma.')
})

test('clears an active highlight from the None picker option', async ({
  page,
}) => {
  const api = await mockNotesApi(page, [
    createMockNote('first-note.md', 'Alpha ==🔴beta== gamma.'),
  ])

  await page.goto('/')
  await waitForEditorReady(page)
  await selectTextInFirstParagraph(page, 'beta')
  await pickHighlightColor(page, 'None')

  await expect(firstParagraph(page).locator('.inline-highlight')).toHaveCount(0)
  await expect
    .poll(() => api.getNote('first-note.md')?.content, {
      timeout: 10000,
    })
    .toBe('Alpha beta gamma.')
})
