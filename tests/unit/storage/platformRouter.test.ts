import { describe, expect, it } from 'vitest'
import { httpPlatformApi } from '~/storage/httpPlatformApi'
import { getPlatformApi } from '~/storage/platformRouter'

describe('getPlatformApi', () => {
  it('returns null for browser application type', () => {
    expect(getPlatformApi('browser')).toBeNull()
  })

  it('returns the HTTP platform api for desktop application type', () => {
    expect(getPlatformApi('desktop')).toBe(httpPlatformApi)
  })
})
