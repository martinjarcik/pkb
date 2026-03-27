import { expect, test, type Page, type Route } from '@playwright/test'
import { createMockNote, mockNotesApi } from './helpers'

async function mockFoldersApi(
  page: Page,
): Promise<{ createdFolders: string[] }> {
  const state = { createdFolders: [] as string[] }

  await page.route('**/api/folders', async (route: Route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { name: string }

      state.createdFolders.push(body.name)

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name: body.name }),
      })
      return
    }

    await route.fallback()
  })

  return state
}

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

test('hides action icons by default and shows them on hover', async ({
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

  const actions = controls.locator('.sidebar-folders-controls-actions')

  await expect(actions).toHaveCSS('opacity', '0')

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

  const controls = page.getByTestId('sidebar-folders-controls')

  await controls.hover()
  await page.getByTestId('sidebar-folders-toggle').click()

  await expect(page.getByTestId('sidebar-folders-actions')).toHaveCount(0)

  await controls.hover()
  await page.getByTestId('sidebar-folders-toggle').click()

  await expect(page.getByTestId('sidebar-folders-actions')).toBeVisible()
})

test('opens create-folder modal and creates a folder', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('Work/report.md', '# Report'),
    createMockNote('inbox.md', '# Inbox'),
  ])
  const foldersApi = await mockFoldersApi(page)

  await page.goto('/')
  await expect(page.getByTestId('sidebar-folders')).toBeVisible({
    timeout: 10000,
  })

  const controls = page.getByTestId('sidebar-folders-controls')

  await controls.hover()
  await page.getByTestId('sidebar-folders-create').click()

  await expect(page.getByTestId('create-folder-name-input')).toBeVisible()

  await page.getByTestId('create-folder-name-input').fill('Projects')
  await page.getByTestId('create-folder-confirm').click()

  await expect(page.getByTestId('create-folder-name-input')).toHaveCount(0)
  expect(foldersApi.createdFolders).toContain('Projects')

  await expect(
    page.locator('[data-navigation-id="folder:Projects"]'),
  ).toBeVisible()
})

test('cancels folder creation without creating', async ({ page }) => {
  await mockNotesApi(page, [
    createMockNote('Work/report.md', '# Report'),
    createMockNote('inbox.md', '# Inbox'),
  ])
  const foldersApi = await mockFoldersApi(page)

  await page.goto('/')
  await expect(page.getByTestId('sidebar-folders')).toBeVisible({
    timeout: 10000,
  })

  const controls = page.getByTestId('sidebar-folders-controls')

  await controls.hover()
  await page.getByTestId('sidebar-folders-create').click()

  await expect(page.getByTestId('create-folder-name-input')).toBeVisible()

  await page.getByTestId('create-folder-cancel').click()

  await expect(page.getByTestId('create-folder-name-input')).toHaveCount(0)
  expect(foldersApi.createdFolders).toHaveLength(0)
})
