import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  })

  it('reads config through persistence using the default storage type', async () => {
    readAppConfigPersistence.mockResolvedValue(loadConfig())

    const { loadAppConfigDisk } = useAppConfigDisk()
    await loadAppConfigDisk()

    expect(readAppConfigPersistence).toHaveBeenCalledWith(
      'filesystem',
      expect.anything(),
    )
  })

  it('updates the data ref after saving config', async () => {
    const updatedConfig = { ...loadConfig(), locale: 'pl' }
    writeAppConfigPatchPersistence.mockResolvedValue(updatedConfig)

    const { data, saveAppConfigPatch } = useAppConfigDisk()
    await saveAppConfigPatch({ locale: 'pl' })

    expect(data.value.locale).toBe('pl')
  })
})
