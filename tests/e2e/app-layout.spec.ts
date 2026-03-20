import { expect, test } from '@playwright/test'

test('renders the default application layout', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('sidebar')).toBeVisible()
  await expect(page.getByTestId('note-list')).toBeVisible()
  await expect(page.getByTestId('note-panel')).toBeVisible()
  await expect(page.getByTestId('inspector')).toBeVisible()
})
