import { describe, expect, it } from 'vitest'
import { loadConfig } from '~/config/loader'

describe('loadConfig', () => {
  it('loads the bundled default config', () => {
    expect(loadConfig()).toMatchObject({
      storageType: 'filesystem',
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
        showSidebarPanel: true,
        showNotesListPanel: true,
        sidebarPanelWidth: 300,
        notesListPanelWidth: 370,
      },
      theme: {
        accentColor: '#3f57dfff',
        sidebarBackgroundColor: '#fafafa',
        sidebarTextColor: '#444444',
        defaultEditorColor: 'yellow',
      },
    })
  })

  it('returns the same parsed config instance across calls', () => {
    expect(loadConfig()).toBe(loadConfig())
  })
})
