import { describe, expect, it } from 'vitest'
import type { AppConfig } from '~/config/loader'
import { browserStorage } from '~/storage/browser'
import { getNoteStorage } from '~/storage/router'

const baseConfig: AppConfig = {
  applicationType: 'browser',
  vault: './vault',
  layout: {
    showInspectorPanel: true,
    showSidebarPanel: true,
    showNotesListPanel: true,
  },
}

describe('getNoteStorage', () => {
  it('returns browser storage for browser application type', () => {
    expect(getNoteStorage(baseConfig)).toBe(browserStorage)
  })

  it('returns filesystem storage for desktop application type', () => {
    const storage = getNoteStorage({
      ...baseConfig,
      applicationType: 'desktop',
    })

    expect(storage).toBeDefined()
    expect(typeof storage.loadNotes).toBe('function')
    expect(typeof storage.saveNote).toBe('function')
    expect(typeof storage.deleteNote).toBe('function')
  })

  it('throws for unsupported application types', () => {
    expect(() =>
      getNoteStorage({
        ...baseConfig,
        applicationType: 'unknown' as AppConfig['applicationType'],
      }),
    ).toThrow('Unsupported application type: unknown')
  })
})
