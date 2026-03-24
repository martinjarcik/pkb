import { expect, test } from '@playwright/test'

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

test('renders the first loaded note in the Editor.js surface', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByTestId('note-editor-holder')).toBeVisible()
  await expect(page.getByTestId('note-editor-error')).toHaveCount(0)
  await expect(page.getByTestId('note-editor-loading')).toHaveCount(0)
  await expect(page.locator('.ce-block')).not.toHaveCount(0)
})

test('keeps block actions and slash menu on the left side of the content', async ({
  page,
}) => {
  await page.goto('/')

  const paragraph = page.locator('.ce-paragraph').first()

  await paragraph.click()

  const blockBox = await page
    .locator('.ce-block__content')
    .first()
    .boundingBox()
  const plusBox = await page.locator('.ce-toolbar__plus').first().boundingBox()

  expect(blockBox).not.toBeNull()
  expect(plusBox).not.toBeNull()
  expect(plusBox!.x).toBeLessThan(blockBox!.x)

  await page.keyboard.press('Enter')
  await page.keyboard.type('/')

  const menuItemBox = await page
    .locator('.ce-popover-item')
    .first()
    .boundingBox()

  expect(menuItemBox).not.toBeNull()
  expect(menuItemBox!.x).toBeLessThan(blockBox!.x)
})

test('renders heading blocks with larger typography than paragraphs', async ({
  page,
}) => {
  await page.goto('/')

  const paragraph = page.locator('.ce-paragraph').first()

  await paragraph.click()
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('/')
  await page
    .locator('.ce-popover-item')
    .filter({ hasText: 'Heading' })
    .first()
    .click()
  await page.keyboard.type('Heading test')

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
})

test('allows changing a heading block between levels', async ({ page }) => {
  await page.goto('/')

  const paragraph = page.locator('.ce-paragraph').first()

  await paragraph.click()
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('/')
  await page
    .locator('.ce-popover-item')
    .filter({ hasText: 'Heading' })
    .first()
    .click()
  await page.keyboard.type('Heading test')
  await page.locator('.ce-header').first().click()
  await page.locator('.ce-toolbar__settings-btn').first().click()
  await page
    .locator('.ce-popover-item')
    .filter({ hasText: 'Heading 1' })
    .first()
    .click()

  await expect(page.locator('h1.ce-header').first()).toBeVisible()
})

test('shows checklist only once in the slash menu', async ({ page }) => {
  await page.goto('/')

  const paragraph = page.locator('.ce-paragraph').first()

  await paragraph.click()
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('/')

  await expect(
    page.locator('.ce-popover-item').filter({ hasText: 'Checklist' }),
  ).toHaveCount(1)
})
