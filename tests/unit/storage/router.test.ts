import { describe, expect, it } from 'vitest'
import type { AppConfig } from '~/config/loader'
import { browserStorage } from '~/storage/browser'
import { getNoteStorage } from '~/storage/router'

const baseConfig: AppConfig = {
  applicationType: 'browser',
  vault: './vault',
  layout: {
    showInspector: true,
    showSidebar: true,
    showNoteList: true,
  },
}

describe('getNoteStorage', () => {
  it('returns browser storage for browser application type', () => {
    expect(getNoteStorage(baseConfig)).toBe(browserStorage)
  })

  it('throws for unimplemented storage backends', () => {
    expect(() =>
      getNoteStorage({
        ...baseConfig,
        applicationType: 'desktop',
      }),
    ).toThrow('Desktop note storage is not implemented yet')

    expect(() =>
      getNoteStorage({
        ...baseConfig,
        applicationType: 'cloud',
      }),
    ).toThrow('Cloud note storage is not implemented yet')
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
