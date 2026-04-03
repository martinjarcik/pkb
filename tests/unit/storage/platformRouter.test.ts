import { describe, expect, it } from 'vitest'
import { httpPlatformApi } from '~/storage/httpPlatformApi'
import { getPlatformApi } from '~/storage/platformRouter'

describe('getPlatformApi', () => {
  it('returns the HTTP platform api for filesystem storage type', () => {
    expect(getPlatformApi('filesystem')).toBe(httpPlatformApi)
  })

  it('returns null for database storage type', () => {
    expect(getPlatformApi('database')).toBeNull()
  })
})
