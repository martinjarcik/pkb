import { describe, expect, it } from 'vitest'
import { getPlatformApi } from '~/storage/platformRouter'
import { getNoteStorage } from '~/storage/router'

describe('getNoteStorage', () => {
  it('returns a filesystem storage for filesystem storage type', () => {
    const storage = getNoteStorage({
      storageType: 'filesystem',
      platformApi: getPlatformApi('filesystem', './vault', 'assets'),
      vault: './vault',
    })

    expect(storage).toBeDefined()
    expect(typeof storage.loadAllNotes).toBe('function')
  })

  it('throws for database storage type (not yet implemented)', () => {
    expect(() =>
      getNoteStorage({
        storageType: 'database',
        platformApi: null,
        vault: './vault',
      }),
    ).toThrow('Database storage is not yet implemented')
  })

  it('throws for unsupported storage types', () => {
    expect(() =>
      getNoteStorage({
        storageType: 'unknown' as 'filesystem',
        platformApi: null,
        vault: './vault',
      }),
    ).toThrow('Unsupported storage type: unknown')
  })
})
