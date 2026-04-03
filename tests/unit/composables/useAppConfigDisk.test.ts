import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadConfig } from '~/config/loader'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'

const { stateStore, readAppConfigPersistence, writeAppConfigPatchPersistence } =
  vi.hoisted(() => ({
    stateStore: new Map<string, { value: unknown }>(),
    readAppConfigPersistence: vi.fn(),
    writeAppConfigPatchPersistence: vi.fn(),
  }))

function mockedUseState<T>(key: string, init: () => T) {
  if (!stateStore.has(key)) {
    stateStore.set(key, { value: init() })
  }

  return stateStore.get(key) as { value: T }
}

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key) {
      return store.get(key) ?? null
    },
    key(index) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key) {
      store.delete(key)
    },
    setItem(key, value) {
      store.set(key, String(value))
    },
  }
}

vi.mock('#app', () => ({
  useState: mockedUseState,
}))

vi.mock('#imports', () => ({
  useState: mockedUseState,
}))

vi.mock('nuxt/app', () => ({
  useState: mockedUseState,
}))

vi.mock('~/config/persistence', () => ({
  readAppConfigPersistence,
  writeAppConfigPatchPersistence,
}))

describe('useAppConfigDisk', () => {
  beforeEach(() => {
    stateStore.clear()
    readAppConfigPersistence.mockReset()
    writeAppConfigPatchPersistence.mockReset()
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('boots from the stored application type marker before reading persistence', async () => {
    localStorage.setItem('pkb:application-type', 'browser')
    readAppConfigPersistence.mockResolvedValue({
      ...loadConfig(),
      applicationType: 'browser',
    })

    const { loadAppConfigDisk } = useAppConfigDisk()
    await loadAppConfigDisk()

    expect(readAppConfigPersistence).toHaveBeenCalledWith('browser', null)
  })

  it('updates the stored application type marker after saving config', async () => {
    writeAppConfigPatchPersistence.mockResolvedValue({
      ...loadConfig(),
      applicationType: 'browser',
    })

    const { saveAppConfigPatch } = useAppConfigDisk()
    await saveAppConfigPatch({ applicationType: 'browser' })

    expect(localStorage.getItem('pkb:application-type')).toBe('browser')
  })
})
