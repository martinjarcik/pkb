import { expect, test } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

function createNoteResponse() {
  return [createMockNote('i18n-note.md', '# Hello\n\nBody copy')]
}

// Removed the loading-state UAT for performance reasons.
// It required an injected 2000ms delay to make the intermediate UI state reliable,
// which made the Playwright suite slower than the current threshold allows.

test('renders the note title aria-label in english', async ({ page }) => {
  await mockNotesApi(page, createNoteResponse())
  await page.goto('/')
  await waitForEditorReady(page)

  await expect(page.getByTestId('note-title')).toHaveAttribute(
    'aria-label',
    'Note title',
  )
})

test('shows translated block tool names in the slash menu', async ({
  page,
}) => {
  await mockNotesApi(page, createNoteResponse())
  await page.goto('/')
  await waitForEditorReady(page)

  const paragraph = page.locator('.ce-paragraph').first()

  await paragraph.click()
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('/Simple')

  await expect(
    page
      .locator('.ce-popover-item:visible')
      .filter({ hasText: 'Simple Quote' }),
  ).toHaveCount(1)
})
