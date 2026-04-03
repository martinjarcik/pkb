import { expect, test, type Page } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

function layoutMenuTrigger(page: Page) {
  return page.getByLabel('Layout options')
}

function sidebarMenuItem(page: Page) {
  return page.getByRole('menuitem', { name: /Sidebar/ })
}

function inspectorMenuItem(page: Page) {
  return page.getByRole('menuitem', { name: /Inspector/ })
}

test.beforeEach(async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('note.md', 'Some content for the test.'),
  ])
})

test('opens the layout menu on trigger click', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await layoutMenuTrigger(page).click()

  await expect(sidebarMenuItem(page)).toBeVisible()
  await expect(inspectorMenuItem(page)).toBeVisible()
})

test('closes the layout menu on outside click', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await layoutMenuTrigger(page).click()
  await expect(sidebarMenuItem(page)).toBeVisible()

  await page.getByTestId('note-panel').click()

  await expect(sidebarMenuItem(page)).not.toBeVisible()
})

test('closes the layout menu on Escape', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await layoutMenuTrigger(page).click()
  await expect(sidebarMenuItem(page)).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(sidebarMenuItem(page)).not.toBeVisible()
})

test('hides the sidebar panel via the layout menu', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await expect(page.getByTestId('sidebar-panel')).toBeVisible()

  await layoutMenuTrigger(page).click()
  await sidebarMenuItem(page).click()

  await expect(page.getByTestId('sidebar-panel')).not.toBeVisible()
})

test('shows the sidebar panel back after hiding it', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await layoutMenuTrigger(page).click()
  await sidebarMenuItem(page).click()
  await expect(page.getByTestId('sidebar-panel')).not.toBeVisible()

  await layoutMenuTrigger(page).click()
  await sidebarMenuItem(page).click()
  await expect(page.getByTestId('sidebar-panel')).toBeVisible()
})

test('hides the inspector panel via the layout menu', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await expect(page.getByTestId('inspector-panel')).toBeVisible()

  await layoutMenuTrigger(page).click()
  await inspectorMenuItem(page).click()

  await expect(page.getByTestId('inspector-panel')).not.toBeVisible()
})

test('menu label reflects current sidebar visibility', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await layoutMenuTrigger(page).click()
  await expect(sidebarMenuItem(page)).toHaveText('Hide Sidebar')

  await sidebarMenuItem(page).click()

  await layoutMenuTrigger(page).click()
  await expect(sidebarMenuItem(page)).toHaveText('Show Sidebar')
})

test('menu label reflects current inspector visibility', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await layoutMenuTrigger(page).click()
  await expect(inspectorMenuItem(page)).toHaveText('Hide Inspector')

  await inspectorMenuItem(page).click()

  await layoutMenuTrigger(page).click()
  await expect(inspectorMenuItem(page)).toHaveText('Show Inspector')
})

test('menu closes after toggling a panel', async ({ page }) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await layoutMenuTrigger(page).click()
  await sidebarMenuItem(page).click()

  await expect(page.getByRole('menu')).not.toBeVisible()
})
