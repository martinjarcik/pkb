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

  it('throws for unsupported storage types', () => {
    expect(() =>
      getNoteStorage({
        storageType: 'unknown' as 'filesystem',
        platformApi: getPlatformApi('filesystem', './vault', 'assets'),
        vault: './vault',
      }),
    ).toThrow('Unsupported storage type: unknown')
  })
})
