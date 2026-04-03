import { expect, test, type Page } from '@playwright/test'
import { createMockNote, mockNotesApi } from './helpers'

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
}) => {
  const marker = `autosave-saved-${Date.now()}`
  const noteId = 'autosave-note.md'
  const api = await mockNotesApi(page, [
    createMockNote(noteId, 'Seed paragraph.\n\nSecond paragraph.'),
  ])

  await page.goto('/')
  await openNote(page, noteId)
  await appendMarkerToFirstParagraph(page, marker)

  await expect
    .poll(() => api.getNote(noteId)?.content, {
      timeout: 10000,
    })
    .toContain(marker)

  await page.reload()
  await openNote(page, noteId)
  await expect(firstBodyParagraph(page)).toBeVisible({ timeout: 10000 })
  await expect(firstBodyParagraph(page)).toContainText(marker)
})
