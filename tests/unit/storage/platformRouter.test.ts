import { describe, expect, it } from 'vitest'
import { getPlatformApi } from '~/storage/platformRouter'

describe('getPlatformApi', () => {
  it('returns the tauri platform api for filesystem storage type', () => {
    const platformApi = getPlatformApi('filesystem', '/vault', 'assets')

    expect(platformApi).not.toBeNull()
    expect(typeof platformApi?.readAllNotes).toBe('function')
    expect(typeof platformApi?.ensureReady).toBe('function')
    expect(typeof platformApi?.assetUrl).toBe('function')
  })

  it('returns null for database storage type', () => {
    expect(getPlatformApi('database', '/vault', 'assets')).toBeNull()
  })
})
