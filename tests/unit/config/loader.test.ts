import { describe, expect, it } from 'vitest'
import { parseAppConfig } from '~/config/loader'

describe('parseAppConfig', () => {
  it('accepts a non-empty locale string', () => {
    expect(
      parseAppConfig({
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
      }),
    ).toMatchObject({
      applicationType: 'desktop',
      locale: 'en',
    })
  })

  it('rejects an empty locale string', () => {
    expect(() =>
      parseAppConfig({
        applicationType: 'desktop',
        locale: '',
        vault: './vault',
        editor: {
          autosaveDelay: 2000,
        },
        layout: {
          showInspectorPanel: true,
          showSidebarPanel: true,
          showNotesListPanel: true,
        },
      }),
    ).toThrow('Config locale must be a non-empty string')
  })
})
