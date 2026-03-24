import { expect, test, type Page } from '@playwright/test'

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

function visiblePopoverItems(page: Page) {
  return page.locator('.ce-popover-item:visible')
}

async function openHeadingSettings(page: Page): Promise<void> {
  await page.locator('.ce-header').first().click()
  await page.locator('.ce-toolbar__settings-btn').first().click()
}

test('renders the default application layout', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('sidebar-panel')).toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).toBeVisible()
  await expect(page.getByTestId('note-panel')).toBeVisible()
  await expect(page.getByTestId('inspector-panel')).toBeVisible()
})

test('renders loaded notes from filesystem storage in the notes list', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByTestId('notes-list-item')).not.toHaveCount(0)
  await expect(page.getByTestId('notes-list-empty')).toHaveCount(0)

  const noteIds = await page
    .getByTestId('notes-list-item')
    .evaluateAll((items) =>
      items.map((item) => item.getAttribute('data-note-id') ?? ''),
    )
  const noteTitles = await page
    .getByTestId('notes-list-item-title')
    .evaluateAll((titles) =>
      titles.map((title) => title.textContent?.trim() ?? ''),
    )

  expect(noteIds.length).toBeGreaterThan(0)
  expect(noteTitles).toEqual(noteIds)
})

test('selects the first loaded note in the list', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('notes-list-item').first()).toHaveAttribute(
    'data-selected',
    'true',
  )
})

test('renders the first loaded note in the Editor.js surface', async ({
  page,
}) => {
  await page.goto('/')

  await waitForEditorReady(page)
})

test('updates the active note when a different list row is clicked', async ({
  page,
}) => {
  await page.goto('/')

  await waitForEditorReady(page)

  const firstNote = page.getByTestId('notes-list-item').first()
  const secondNote = page.getByTestId('notes-list-item').nth(1)

  await secondNote.click()

  await expect(secondNote).toHaveAttribute('data-selected', 'true')
  await expect(firstNote).toHaveAttribute('data-selected', 'false')
  await expect(page.locator('.ce-block')).not.toHaveCount(0)
})

test('shows block conversion options for a heading block', async ({ page }) => {
  await page.goto('/')

  await waitForEditorReady(page)

  await openHeadingSettings(page)

  await expect(visiblePopoverItems(page).first()).toBeVisible()
})

test('renders heading blocks with larger typography than paragraphs', async ({
  page,
}) => {
  await page.goto('/')

  await waitForEditorReady(page)

  const heading = page.locator('.ce-header').first()
  const paragraph = page.locator('.ce-paragraph').first()

  const fontSizes = await page.evaluate(() => {
    const heading = document.querySelector(
      'h1.ce-header, h2.ce-header, h3.ce-header, h4.ce-header, h5.ce-header, h6.ce-header',
    )
    const paragraph = document.querySelector('.ce-paragraph')

    return {
      heading: heading
        ? Number.parseFloat(getComputedStyle(heading).fontSize)
        : 0,
      paragraph: paragraph
        ? Number.parseFloat(getComputedStyle(paragraph).fontSize)
        : 0,
    }
  })

  expect(fontSizes.heading).toBeGreaterThan(fontSizes.paragraph)
  await expect(heading).toBeVisible()
  await expect(paragraph).toBeVisible()
})

test('allows changing a heading block between levels', async ({ page }) => {
  await page.goto('/')

  await waitForEditorReady(page)

  await openHeadingSettings(page)
  await page
    .locator('.ce-popover-item:visible')
    .filter({ hasText: 'Heading 2' })
    .nth(1)
    .click({ force: true })

  await expect(page.locator('h2.ce-header').first()).toBeVisible()
})

test('shows checklist only once in the block conversion menu', async ({
  page,
}) => {
  await page.goto('/')

  await waitForEditorReady(page)

  await openHeadingSettings(page)

  await expect(
    page.locator('.ce-popover-item:visible').filter({ hasText: 'Checklist' }),
  ).toHaveCount(1)
})
