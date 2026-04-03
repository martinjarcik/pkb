import { expect, test } from '@playwright/test'
import { createMockNote, mockNotesApi } from './helpers'

test('shows Folders title in the sidebar when folders exist', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('Work/report.md', '# Report'),
    createMockNote('inbox.md', '# Inbox'),
  ])

  await page.goto('/')
  await expect(page.getByTestId('sidebar-folders')).toBeVisible({
    timeout: 10000,
  })

  await expect(page.getByTestId('sidebar-folders-controls')).toBeVisible()
  await expect(page.getByTestId('sidebar-folders-controls')).toContainText(
    'Folders',
  )
})

test('hides create-folder icon by default and shows it on hover', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('Work/report.md', '# Report'),
    createMockNote('inbox.md', '# Inbox'),
  ])

  await page.goto('/')
  await expect(page.getByTestId('sidebar-folders')).toBeVisible({
    timeout: 10000,
  })

  const controls = page.getByTestId('sidebar-folders-controls')

  await expect(controls).toBeVisible()

  const actions = controls.locator('.sidebar-section-controls-actions')

  await expect(actions).toHaveCSS('opacity', '0')
  await expect(page.getByTestId('sidebar-folders-toggle')).toBeVisible()

  await controls.hover()

  await expect(actions).toHaveCSS('opacity', '1')
})

test('collapses and expands the folder list with the chevron', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('Work/report.md', '# Report'),
    createMockNote('inbox.md', '# Inbox'),
  ])

  await page.goto('/')
  await expect(page.getByTestId('sidebar-folders')).toBeVisible({
    timeout: 10000,
  })

  await expect(page.getByTestId('sidebar-folders-actions')).toBeVisible()

  await page.getByTestId('sidebar-folders-toggle').click()

  await expect(page.getByTestId('sidebar-folders-actions')).toHaveCount(0)

  await page.getByTestId('sidebar-folders-toggle').click()

  await expect(page.getByTestId('sidebar-folders-actions')).toBeVisible()
})

test('opens create-folder modal and creates a folder', async ({ page }) => {
  const api = await mockNotesApi(page, [
    createMockNote('Work/report.md', '# Report'),
    createMockNote('inbox.md', '# Inbox'),
  ])
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.getByTestId('sidebar-folders')).toBeVisible({
    timeout: 10000,
  })

  const controls = page.getByTestId('sidebar-folders-controls')
  const createButton = page.getByTestId('sidebar-folders-create')

  await controls.hover()
  await expect(createButton).toBeVisible()
  await createButton.click()

  await expect(page.getByTestId('folder-dialog-name-input')).toBeVisible()

  await page.getByTestId('folder-dialog-name-input').fill('Projects')
  await page.getByTestId('folder-dialog-confirm').click()

  await expect(page.getByTestId('folder-dialog-name-input')).toHaveCount(0)
  expect(api.getExplicitFolders()).toContain('Projects')

  await expect(
    page.locator('[data-navigation-id="folder:Projects"]'),
  ).toBeVisible()
})

test('cancels folder creation without creating', async ({ page }) => {
  const api = await mockNotesApi(page, [
    createMockNote('Work/report.md', '# Report'),
    createMockNote('inbox.md', '# Inbox'),
  ])
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.getByTestId('sidebar-folders')).toBeVisible({
    timeout: 10000,
  })

  const controls = page.getByTestId('sidebar-folders-controls')
  const createButton = page.getByTestId('sidebar-folders-create')

  await controls.hover()
  await expect(createButton).toBeVisible()
  await createButton.click()

  await expect(page.getByTestId('folder-dialog-name-input')).toBeVisible()

  await page.getByTestId('folder-dialog-cancel').click()

  await expect(page.getByTestId('folder-dialog-name-input')).toHaveCount(0)
  expect(api.getExplicitFolders()).toHaveLength(0)
})
