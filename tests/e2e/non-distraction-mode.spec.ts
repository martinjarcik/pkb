import { expect, test, type Page } from '@playwright/test'
import {
  createMockNote,
  mockAppConfigApi,
  mockNotesApi,
  waitForEditorReady,
} from './helpers'

function layoutMenuTrigger(page: Page) {
  return page.getByLabel('Layout options')
}

function sidebarMenuItem(page: Page) {
  return page.getByRole('menuitem', { name: /Sidebar/ })
}

test.beforeEach(async ({ page }) => {
  await mockAppConfigApi(page)
  await mockNotesApi(page, [createMockNote('root-note.md')])
})

test('non-distraction mode hides all panels and restores on second click', async ({
  page,
}) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await expect(page.getByTestId('sidebar-panel')).toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).toBeVisible()
  await expect(page.getByTestId('inspector-panel')).toBeVisible()

  await page.getByTestId('note-non-distraction').click()
  await expect(page.getByTestId('sidebar-panel')).not.toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).not.toBeVisible()
  await expect(page.getByTestId('inspector-panel')).not.toBeVisible()

  await page.getByTestId('note-non-distraction').click()
  await expect(page.getByTestId('sidebar-panel')).toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).toBeVisible()
  await expect(page.getByTestId('inspector-panel')).toBeVisible()
})

test('non-distraction mode restores prior layout when sidebar was hidden', async ({
  page,
}) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await layoutMenuTrigger(page).click()
  await sidebarMenuItem(page).click()
  await expect(page.getByTestId('sidebar-panel')).not.toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).toBeVisible()
  await expect(page.getByTestId('inspector-panel')).toBeVisible()

  await page.getByTestId('note-non-distraction').click()
  await expect(page.getByTestId('sidebar-panel')).not.toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).not.toBeVisible()
  await expect(page.getByTestId('inspector-panel')).not.toBeVisible()

  await page.getByTestId('note-non-distraction').click()
  await expect(page.getByTestId('sidebar-panel')).not.toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).toBeVisible()
  await expect(page.getByTestId('inspector-panel')).toBeVisible()
})
