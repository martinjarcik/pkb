import { describe, expect, it } from 'vitest'
import { parseAppConfig } from '~/config/loader'
import { deepMergeAppConfig } from '~/config/mergeAppConfigPatch'

function createEditorColors() {
  return {
    red: { emoji: '🔴', background: '#F9EAE7', text: '#C0594E', label: 'Red' },
    pink: {
      emoji: '🩷',
      background: '#F7EAF1',
      text: '#EB445A',
      label: 'Pink',
    },
    mint: {
      emoji: '🟢',
      background: '#E6F6F4',
      text: '#5AC5B3',
      label: 'Mint',
    },
    yellow: {
      emoji: '🟡',
      background: '#F8F3DE',
      text: '#C39647',
      label: 'Yellow',
    },
    blue: {
      emoji: '🔵',
      background: '#E7F2FB',
      text: '#3B86F7',
      label: 'Blue',
    },
    orange: {
      emoji: '🟠',
      background: '#F8ECDF',
      text: '#F09343',
      label: 'Orange',
    },
    purple: {
      emoji: '🟣',
      background: '#F2EBF8',
      text: '#BB3ED9',
      label: 'Purple',
    },
    grey: {
      emoji: '⚪️',
      background: '#F0EFED',
      text: '#7C7A76',
      label: 'Grey',
    },
    brown: {
      emoji: '🟤',
      background: '#F4EDE9',
      text: '#99785E',
      label: 'Brown',
    },
  }
}

function createConfigRecord(): Record<string, unknown> {
  return {
    storageType: 'filesystem',
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
    editorColors: createEditorColors(),
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
