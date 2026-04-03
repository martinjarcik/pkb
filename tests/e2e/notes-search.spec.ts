import { expect, test, type Page } from '@playwright/test'
import { createMockNote, mockNotesApi } from './helpers'

async function mockInitApi(
  page: Page,
  catalog: ReturnType<typeof createMockNote>[],
) {
  await page.route('**/api/init', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        config: {
          applicationType: 'desktop',
          locale: 'en',
          vault: './vault',
          notes: {
            trashRetentionDays: 30,
          },
          editor: {
            autosaveDelay: 2000,
            assetsFolder: 'assets',
          },
          layout: {
            showInspectorPanel: true,
            showSidebarPanel: true,
            showNotesListPanel: true,
          },
          theme: {
            accentColor: '#3f57dfff',
            defaultEditorColor: 'yellow',
          },
          features: {
            favorites: true,
            tasks: true,
            pinned: true,
            nonDistractionMode: true,
            noteWebhook: true,
          },
        },
        catalog,
        folders: [],
        meta: {},
      }),
    })
  })
}

test('searches across the whole vault and clears sidebar selection while active', async ({
  page,
}) => {
  const notes = [
    createMockNote('alpha.md', 'Build bridges in teams.', undefined, {
      tags: ['engineering'],
    }),
    createMockNote('beta.md', 'Private note body.', undefined, {
      tags: ['personal'],
    }),
    createMockNote('trashed.md', 'Bridge archive.', undefined, {
      trashedAt: '2026-03-20T00:00:00.000Z',
    }),
  ]
  await mockInitApi(page, notes)
  await mockNotesApi(page, notes)

  await page.goto('/', { waitUntil: 'networkidle' })
  const engineeringTag = page.locator('[data-tag="engineering"]')

  await engineeringTag.click()
  await expect(engineeringTag).toHaveAttribute('data-state', 'active')

  await page.getByTestId('notes-list-search-input').fill('bridge')

  await expect(page.getByTestId('notes-list-item')).toHaveCount(2)
  await expect(page.locator('[data-note-id="alpha.md"]')).toBeVisible()
  await expect(page.locator('[data-note-id="trashed.md"]')).toBeVisible()
  await expect(engineeringTag).toHaveAttribute('data-state', 'idle')
})

test('restores the previous sidebar view when search is cleared', async ({
  page,
}) => {
  const notes = [
    createMockNote('alpha.md', 'A'.repeat(1100) + ' hiddenneedle', undefined, {
      tags: ['engineering'],
    }),
    createMockNote('beta.md', 'Other note body.', undefined, {
      tags: ['personal'],
    }),
  ]
  await mockInitApi(page, notes)
  await mockNotesApi(page, notes)

  await page.goto('/', { waitUntil: 'networkidle' })
  const engineeringTag = page.locator('[data-tag="engineering"]')

  await engineeringTag.click()
  await page.getByTestId('notes-list-search-input').fill('hiddenneedle')

  await expect(page.getByTestId('notes-list-item')).toHaveCount(1)
  await expect(page.locator('[data-note-id="alpha.md"]')).toBeVisible()

  await page.getByTestId('notes-list-search-input').fill('')

  await expect(engineeringTag).toHaveAttribute('data-state', 'active')
  await expect(page.getByTestId('notes-list-item')).toHaveCount(1)
  await expect(page.locator('[data-note-id="alpha.md"]')).toBeVisible()
})
