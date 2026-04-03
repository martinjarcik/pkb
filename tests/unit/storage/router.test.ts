import { describe, expect, it } from 'vitest'
import type { AppConfig } from '~/config/loader'
import { browserStorage } from '~/storage/browser'
import { getPlatformApi } from '~/storage/platformRouter'
import { getNoteStorage } from '~/storage/router'

const baseConfig: AppConfig = {
  applicationType: 'browser',
  locale: 'en',
  vault: './vault',
  notes: {
    trashRetentionDays: 30,
  },
  editor: {
    autosaveDelay: 2000,
  },
  layout: {
    showInspectorPanel: true,
    showSidebarPanel: true,
    showNotesListPanel: true,
  },
  theme: {
    accentColor: '#3f57dfff',
  },
  features: {
    favorites: true,
    tasks: true,
    pinned: true,
    nonDistractionMode: true,
    noteWebhook: true,
  },
}

describe('getNoteStorage', () => {
  it('returns browser storage for browser application type', () => {
    expect(
      getNoteStorage({
        ...baseConfig,
        platformApi: getPlatformApi(baseConfig.applicationType),
      }),
    ).toBe(browserStorage)
  })

  it('returns a distinct storage for desktop application type', () => {
    const storage = getNoteStorage({
      ...baseConfig,
      applicationType: 'desktop',
      platformApi: getPlatformApi('desktop'),
    })

    expect(storage).not.toBe(browserStorage)
  })

  it('throws for unsupported application types', () => {
    expect(() =>
      getNoteStorage({
        ...baseConfig,
        applicationType: 'unknown' as AppConfig['applicationType'],
        platformApi: null,
      }),
    ).toThrow('Unsupported application type: unknown')
  })
})
