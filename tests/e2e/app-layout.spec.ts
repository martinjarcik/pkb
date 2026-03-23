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
