import { expect, test } from '@playwright/test'

test('renders the default application layout', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('sidebar-panel')).toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).toBeVisible()
  await expect(page.getByTestId('note-panel')).toBeVisible()
  await expect(page.getByTestId('inspector-panel')).toBeVisible()
})
