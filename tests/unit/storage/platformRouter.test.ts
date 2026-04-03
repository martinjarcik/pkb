import { afterEach, describe, expect, it } from 'vitest'
import { httpPlatformApi } from '~/storage/httpPlatformApi'
import { detectApplicationType, getPlatformApi } from '~/storage/platformRouter'

type TestWindow = Window & { __TAURI_INTERNALS__?: unknown }

function setTestWindow(value: TestWindow | undefined): void {
  if (value === undefined) {
    delete (globalThis as { window?: TestWindow }).window
    return
  }

  ;(globalThis as { window?: TestWindow }).window = value
}

function getTestWindow(): TestWindow {
  return ((globalThis as { window?: TestWindow }).window ?? {}) as TestWindow
}

describe('getPlatformApi', () => {
  afterEach(() => {
    setTestWindow(undefined)
  })

  it('returns null for browser application type', () => {
    expect(getPlatformApi('browser')).toBeNull()
  })

  it('returns the HTTP platform api for desktop application type', () => {
    expect(getPlatformApi('desktop')).toBe(httpPlatformApi)
  })

  it('detects desktop application type in a Tauri runtime', () => {
    setTestWindow({} as TestWindow)
    getTestWindow().__TAURI_INTERNALS__ = {}

    expect(detectApplicationType()).toBe('desktop')
  })

  it('returns null when no Tauri runtime is present', () => {
    setTestWindow({} as TestWindow)

    expect(detectApplicationType()).toBeNull()
  })
})
