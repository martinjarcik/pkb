import yaml from 'yaml'
import { describe, expect, it, vi } from 'vitest'
import { loadConfig } from '~/config/loader'
import {
  readAppConfigPersistence,
  writeAppConfigPatchPersistence,
} from '~/config/persistence'
import type { PlatformApi } from '~/storage/platformApi'

function createPlatformApiMock(): PlatformApi {
  return {
    readAllNotes: vi.fn(),
    writeTextFile: vi.fn(),
    deleteTextFile: vi.fn(),
    renameTextFile: vi.fn(),
    createDirectory: vi.fn(),
    renameDirectory: vi.fn(),
    readScopedTextFile: vi.fn(),
    writeScopedTextFile: vi.fn(),
    uploadAsset: vi.fn(),
    assetUrl: vi.fn(),
    markdownUrlFromAssetUrl: vi.fn(),
  }
}

describe('persistence', () => {
  it('reads app config through the platform api and parses YAML', async () => {
    const platformApi = createPlatformApiMock()
    const config = loadConfig()

    vi.mocked(platformApi.readScopedTextFile).mockResolvedValue(
      yaml.stringify(config),
    )

    const loaded = await readAppConfigPersistence('filesystem', platformApi)

    expect(platformApi.readScopedTextFile).toHaveBeenCalledWith('app-config')
    expect(loaded).toEqual(config)
  })

  it('writes app config through the platform api as YAML text', async () => {
    const platformApi = createPlatformApiMock()
    const config = loadConfig()

    vi.mocked(platformApi.readScopedTextFile).mockResolvedValue(
      yaml.stringify(config),
    )
    vi.mocked(platformApi.writeScopedTextFile).mockResolvedValue({
      content: '',
      birthtime: '2026-04-03T10:00:00.000Z',
      mtime: '2026-04-03T10:00:00.000Z',
    })

    const updated = await writeAppConfigPatchPersistence(
      'filesystem',
      platformApi,
      { locale: 'pl' },
    )

    expect(platformApi.writeScopedTextFile).toHaveBeenCalledWith(
      'app-config',
      expect.stringContaining('locale: pl'),
    )
    expect(updated.locale).toBe('pl')
  })
})
