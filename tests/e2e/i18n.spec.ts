import { expect, test, type Route } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

function createNoteResponse() {
  return [createMockNote('i18n-note.md', '# Hello\n\nBody copy')]
}

async function fulfillNotesRequest(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(createNoteResponse()),
  })
}

test('shows the loading message while notes are being fetched', async ({
  page,
}) => {
  let releaseNotesResponse: (() => void) | null = null

  await page.route('**/api/notes/**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createNoteResponse()[0]),
    })
  })

  await page.route('**/api/notes', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    await new Promise<void>((resolve) => {
      releaseNotesResponse = resolve
    })

    await fulfillNotesRequest(route)
  })

  const navigation = page.goto('/')

  await expect(page.getByText('Loading notes...')).toBeVisible()

  if (releaseNotesResponse) {
    releaseNotesResponse()
  }
  await navigation
})

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
