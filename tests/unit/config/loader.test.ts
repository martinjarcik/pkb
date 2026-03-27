import { describe, expect, it } from 'vitest'
import { parseAppConfig } from '~/config/loader'

function createConfig() {
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
    },
  }
}

describe('parseAppConfig', () => {
  it('accepts a non-empty locale string', () => {
    expect(parseAppConfig(createConfig())).toMatchObject({
      applicationType: 'desktop',
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
})
