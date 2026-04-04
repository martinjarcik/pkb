import { describe, expect, it } from 'vitest'
import { parseAppConfig } from '~/config/loader'

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

function createConfig() {
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

describe('parseAppConfig', () => {
  it('accepts a non-empty locale string', () => {
    expect(parseAppConfig(createConfig())).toMatchObject({
      storageType: 'filesystem',
      locale: 'en',
    })
  })

  it('rejects an empty locale string', () => {
    const config = createConfig()
    config.locale = ''

    expect(() => parseAppConfig(config)).toThrow(
      'Config locale must be a non-empty string',
    )
  })

  it('returns theme accentColor when the config is valid', () => {
    const config = parseAppConfig(createConfig())

    expect(config.theme.accentColor).toBe('#3f57dfff')
  })

  it('returns configured editor colors when the config is valid', () => {
    const config = parseAppConfig(createConfig())

    expect(config.editorColors.red).toEqual({
      emoji: '🔴',
      background: '#F9EAE7',
      text: '#C0594E',
      label: 'Red',
    })
  })

  it('defaults editor colors when omitted', () => {
    const config = createConfig()
    delete (config as { editorColors?: ReturnType<typeof createEditorColors> })
      .editorColors

    expect(parseAppConfig(config).editorColors.red).toEqual({
      emoji: '🔴',
      background: '#F9EAE7',
      text: '#C0594E',
      label: 'Red',
    })
  })

  it('accepts custom editor color names', () => {
    const config = createConfig()
    ;(
      config as {
        editorColors: Record<
          string,
          { emoji: string; background: string; text: string; label: string }
        >
      }
    ).editorColors = {
      mint: {
        emoji: '🌿',
        background: '#E6F6F4',
        text: '#5AC5B3',
        label: 'Mint',
      },
      coral: {
        emoji: '🪸',
        background: '#FDE7E1',
        text: '#E06050',
        label: 'Coral',
      },
    }

    expect(parseAppConfig(config).editorColors).toEqual({
      mint: {
        emoji: '🌿',
        background: '#E6F6F4',
        text: '#5AC5B3',
        label: 'Mint',
      },
      coral: {
        emoji: '🪸',
        background: '#FDE7E1',
        text: '#E06050',
        label: 'Coral',
      },
    })
  })

  it('accepts legacy editorBackgroundColors and hex keys', () => {
    const config = createConfig() as Record<string, unknown>
    config.editorBackgroundColors = {
      red: { emoji: '🔴', hex: '#111111', text: '#C0594E', label: 'Red' },
      pink: { emoji: '🩷', hex: '#222222', text: '#EB445A', label: 'Pink' },
      mint: { emoji: '🟢', hex: '#333333', text: '#5AC5B3', label: 'Mint' },
      yellow: { emoji: '🟡', hex: '#444444', text: '#C39647', label: 'Yellow' },
      blue: { emoji: '🔵', hex: '#555555', text: '#3B86F7', label: 'Blue' },
      orange: { emoji: '🟠', hex: '#666666', text: '#F09343', label: 'Orange' },
      purple: { emoji: '🟣', hex: '#777777', text: '#BB3ED9', label: 'Purple' },
      grey: { emoji: '⚪️', hex: '#888888', text: '#7C7A76', label: 'Grey' },
      brown: { emoji: '🟤', hex: '#999999', text: '#99785E', label: 'Brown' },
    }
    delete config.editorColors

    expect(parseAppConfig(config).editorColors.pink).toEqual({
      emoji: '🩷',
      background: '#222222',
      text: '#EB445A',
      label: 'Pink',
    })
  })

  it('throws when theme is missing', () => {
    const config = createConfig()
    delete (config as { theme?: { accentColor: string } }).theme

    expect(() => parseAppConfig(config)).toThrow(
      'Config theme must be an object',
    )
  })

  it('throws when theme.accentColor is empty', () => {
    const config = createConfig()
    config.theme.accentColor = ' '

    expect(() => parseAppConfig(config)).toThrow(
      'Config theme.accentColor must be a non-empty string',
    )
  })

  it('throws when an editor color background is empty', () => {
    const config = createConfig()
    config.editorColors.red.background = ' '

    expect(() => parseAppConfig(config)).toThrow(
      'Config editorColors.red.background must be a non-empty string',
    )
  })

  it('defaults features.favorites to true when features is missing', () => {
    const config = createConfig()
    delete (config as { features?: { favorites: boolean } }).features

    expect(parseAppConfig(config).features.favorites).toBe(true)
  })

  it('throws when features is not an object', () => {
    const config = createConfig()
    ;(config as { features: unknown }).features = 'nope'

    expect(() => parseAppConfig(config)).toThrow(
      'Config features must be an object',
    )
  })

  it('throws when features.favorites is not a boolean', () => {
    const config = createConfig()
    config.features.favorites = 1 as unknown as boolean

    expect(() => parseAppConfig(config)).toThrow(
      'Config features.favorites must be a boolean',
    )
  })

  it('defaults features.tasks to true when features.tasks is omitted', () => {
    const config = createConfig()
    delete (config.features as { tasks?: boolean }).tasks

    expect(parseAppConfig(config).features.tasks).toBe(true)
  })

  it('throws when features.tasks is not a boolean', () => {
    const config = createConfig()
    config.features.tasks = 1 as unknown as boolean

    expect(() => parseAppConfig(config)).toThrow(
      'Config features.tasks must be a boolean',
    )
  })

  it('defaults features.pinned to true when features.pinned is omitted', () => {
    const config = createConfig()
    delete (config.features as { pinned?: boolean }).pinned

    expect(parseAppConfig(config).features.pinned).toBe(true)
  })

  it('throws when features.pinned is not a boolean', () => {
    const config = createConfig()
    config.features.pinned = 1 as unknown as boolean

    expect(() => parseAppConfig(config)).toThrow(
      'Config features.pinned must be a boolean',
    )
  })

  it('defaults features.nonDistractionMode to true when omitted', () => {
    const config = createConfig()
    delete (config.features as { nonDistractionMode?: boolean })
      .nonDistractionMode

    expect(parseAppConfig(config).features.nonDistractionMode).toBe(true)
  })

  it('throws when features.nonDistractionMode is not a boolean', () => {
    const config = createConfig()
    config.features.nonDistractionMode = 1 as unknown as boolean

    expect(() => parseAppConfig(config)).toThrow(
      'Config features.nonDistractionMode must be a boolean',
    )
  })

  it('defaults features.noteWebhook to true when omitted', () => {
    const config = createConfig()
    delete (config.features as { noteWebhook?: boolean }).noteWebhook

    expect(parseAppConfig(config).features.noteWebhook).toBe(true)
  })

  it('throws when features.noteWebhook is not a boolean', () => {
    const config = createConfig()
    config.features.noteWebhook = 1 as unknown as boolean

    expect(() => parseAppConfig(config)).toThrow(
      'Config features.noteWebhook must be a boolean',
    )
  })

  it('defaults editor.assetsFolder to assets when omitted', () => {
    const config = createConfig()
    delete (config.editor as { assetsFolder?: string }).assetsFolder

    expect(parseAppConfig(config).editor.assetsFolder).toBe('assets')
  })

  it('accepts a valid editor.assetsFolder', () => {
    const config = createConfig()
    config.editor.assetsFolder = 'media'

    expect(parseAppConfig(config).editor.assetsFolder).toBe('media')
  })

  it('rejects editor.assetsFolder with a slash', () => {
    const config = createConfig()
    config.editor.assetsFolder = 'a/b'

    expect(() => parseAppConfig(config)).toThrow(
      'Config editor.assetsFolder must be a single path segment',
    )
  })

  it('rejects editor.assetsFolder when it is "."', () => {
    const config = createConfig()
    config.editor.assetsFolder = '.'

    expect(() => parseAppConfig(config)).toThrow(
      'Config editor.assetsFolder must not be "." or ".."',
    )
  })
})
