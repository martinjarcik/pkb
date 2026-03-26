import { expect, test, type Route } from '@playwright/test'

function createNoteResponse() {
  return [
    {
      id: 'i18n-note.md',
      content: '# Hello\n\nBody copy',
      createdAt: '2026-03-25T00:00:00.000Z',
      modifiedAt: '2026-03-25T00:00:00.000Z',
    },
  ]
}

async function fulfillNotesRequest(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(createNoteResponse()),
  })
}

test('renders english locale strings from config-backed i18n', async ({
  page,
}) => {
  let releaseNotesResponse: (() => void) | null = null

  await page.route('**/api/notes/**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    const note = createNoteResponse()[0]

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(note),
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

  await expect(page.getByTestId('note-title')).toHaveAttribute(
    'aria-label',
    'Note title',
  )
  await expect(page.getByText('Loading editor...')).toHaveCount(0, {
    timeout: 15000,
  })

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
