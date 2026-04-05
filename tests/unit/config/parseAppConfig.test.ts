import { describe, expect, it } from 'vitest'
import { parseAppConfig } from '~/config/parseAppConfig'

function createBaseConfig() {
  return {
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
    },
    theme: {
      accentColor: '#3f57dfff',
      sidebarBackgroundColor: '#fafafa',
      sidebarTextColor: '#444444',
      defaultEditorColor: 'yellow',
    },
    editorColors: {
      yellow: {
        emoji: '🟡',
        background: '#F8F3DE',
        text: '#C39647',
        label: 'Yellow',
      },
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

describe('parseAppConfig', () => {
  it('parses a valid config', () => {
    expect(parseAppConfig(createBaseConfig())).toEqual(createBaseConfig())
  })

  it('defaults theme.defaultEditorColor when missing', () => {
    const config = createBaseConfig() as Record<string, unknown>
    config.theme = { accentColor: '#3f57dfff' }

    expect(parseAppConfig(config).theme.defaultEditorColor).toBe('yellow')
  })

  it('defaults theme.sidebarBackgroundColor when missing', () => {
    const config = createBaseConfig() as Record<string, unknown>
    config.theme = { accentColor: '#3f57dfff' }

    expect(parseAppConfig(config).theme.sidebarBackgroundColor).toBe('#fafafa')
  })

  it('defaults theme.sidebarTextColor when missing', () => {
    const config = createBaseConfig() as Record<string, unknown>
    config.theme = { accentColor: '#3f57dfff' }

    expect(parseAppConfig(config).theme.sidebarTextColor).toBe('#444444')
  })

  it('falls back to default feature flags when features are omitted', () => {
    const config = createBaseConfig()
    delete (config as { features?: unknown }).features

    expect(parseAppConfig(config).features).toEqual({
      favorites: true,
      tasks: true,
      pinned: true,
      nonDistractionMode: true,
      noteWebhook: true,
    })
  })

  it('accepts legacy editorColors hex values as background', () => {
    const config = createBaseConfig()
    config.theme.defaultEditorColor = 'blue'
    config.editorColors = {
      blue: {
        emoji: '🔵',
        hex: '#E2EDFE',
        text: '#3B86F7',
        label: 'Blue',
      },
    } as unknown as typeof config.editorColors

    expect(parseAppConfig(config).editorColors.blue.background).toBe('#E2EDFE')
  })

  it('rejects unsafe editor assets folder paths', () => {
    const config = createBaseConfig()
    config.editor.assetsFolder = '../assets'

    expect(() => parseAppConfig(config)).toThrow(
      'Config editor.assetsFolder must be a safe relative path',
    )
  })
})
