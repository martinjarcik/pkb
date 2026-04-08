import { describe, expect, it } from 'vitest'
import { getPlatformApi } from '~/storage/platformRouter'

describe('getPlatformApi', () => {
  it('returns the tauri platform api for filesystem storage type', () => {
    const platformApi = getPlatformApi('filesystem', '/vault', 'assets')

    expect(typeof platformApi.readAllNotes).toBe('function')
    expect(typeof platformApi.relocateVault).toBe('function')
    expect(typeof platformApi.ensureReady).toBe('function')
    expect(typeof platformApi.assetUrl).toBe('function')
  })
})
