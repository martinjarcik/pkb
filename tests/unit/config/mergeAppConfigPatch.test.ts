import { describe, expect, it } from 'vitest'
import { parseAppConfig } from '~/config/loader'
import { deepMergeAppConfig } from '~/config/mergeAppConfigPatch'

function createConfigRecord(): Record<string, unknown> {
  return {
    applicationType: 'desktop',
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
}

describe('deepMergeAppConfig', () => {
  it('merges nested layout patch without dropping sibling layout keys', () => {
    const base = createConfigRecord()
    const merged = deepMergeAppConfig(base, {
      layout: { showSidebarPanel: false },
    })

    expect(merged.layout).toEqual({
      showInspectorPanel: true,
      showSidebarPanel: false,
      showNotesListPanel: true,
    })
    expect(parseAppConfig(merged).layout.showSidebarPanel).toBe(false)
  })

  it('preserves unrelated top-level keys when patching layout', () => {
    const base = createConfigRecord()
    const merged = deepMergeAppConfig(base, {
      layout: { showInspectorPanel: false },
    })

    expect(merged.locale).toBe('en')
    expect(merged.vault).toBe('./vault')
    expect(parseAppConfig(merged).theme.accentColor).toBe('#3f57dfff')
  })

  it('rejects merged config when patch corrupts a boolean field', () => {
    const base = createConfigRecord()
    const merged = deepMergeAppConfig(base, {
      layout: { showSidebarPanel: 'invalid' },
    })

    expect(() => parseAppConfig(merged)).toThrow(
      /Config layout\.showSidebarPanel must be a boolean/,
    )
  })
})
