import { describe, expect, it } from 'vitest'
import { parseAppConfig } from '~/config/loader'

function createConfig() {
  return {
    applicationType: 'desktop',
    locale: 'en',
    vault: './vault',
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
})
