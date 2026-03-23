import { expect, test } from '@playwright/test'

test('renders the default application layout', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('sidebar-panel')).toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).toBeVisible()
  await expect(page.getByTestId('note-panel')).toBeVisible()
  await expect(page.getByTestId('inspector-panel')).toBeVisible()
})

test('logs loaded notes from filesystem storage on app load', async ({
  page,
}) => {
  const consoleMessagePromise = page.waitForEvent('console', {
    predicate: (message) =>
      message.type() === 'log' &&
      message.text().includes('Loaded notes from storage'),
  })

  await page.goto('/')

  const consoleMessage = await consoleMessagePromise
  const args = await Promise.all(
    consoleMessage.args().map((argument) => argument.jsonValue()),
  )

  expect(args[0]).toBe('Loaded notes from storage')
  expect(args[1]).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 'first.md',
        content: expect.stringContaining('Peaky Blinders: The Immortal Man'),
      }),
    ]),
  )
})
