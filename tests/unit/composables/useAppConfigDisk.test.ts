import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadConfig } from '~/config/loader'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'

const { readAppConfigPersistence, writeAppConfigPatchPersistence } = vi.hoisted(
  () => ({
    readAppConfigPersistence: vi.fn(),
    writeAppConfigPatchPersistence: vi.fn(),
  }),
)

vi.mock('~/config/persistence', () => ({
  readAppConfigPersistence,
  writeAppConfigPatchPersistence,
}))

describe('useAppConfigDisk', () => {
  beforeEach(() => {
    readAppConfigPersistence.mockReset()
    writeAppConfigPatchPersistence.mockReset()
    useAppConfigDisk().data.value = loadConfig()
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
