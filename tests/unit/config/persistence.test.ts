import yaml from 'yaml'
import { describe, expect, it, vi } from 'vitest'
import { loadConfig } from '~/config/loader'
import {
  readOnboardingPersistence,
  readAppConfigPersistence,
  resetAppPersistence,
  writeOnboardingPersistence,
  writeAppConfigPatchPersistence,
} from '~/config/persistence'
import type { PlatformApi } from '~/storage/platformApi'

function createPlatformApiMock(): PlatformApi {
  return {
    readAllNotes: vi.fn(),
    relocateVault: vi.fn(),
    writeTextFile: vi.fn(),
    deleteTextFile: vi.fn(),
    renameTextFile: vi.fn(),
    createDirectory: vi.fn(),
    renameDirectory: vi.fn(),
    listDirectories: vi.fn().mockResolvedValue([]),
    readScopedTextFile: vi.fn(),
    writeScopedTextFile: vi.fn(),
    ensureReady: vi.fn(),
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

    const loaded = await readAppConfigPersistence(platformApi)

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

    const updated = await writeAppConfigPatchPersistence(platformApi, {
      locale: 'pl',
    })

    expect(platformApi.writeScopedTextFile).toHaveBeenCalledWith(
      'app-config',
      expect.stringContaining('locale: pl'),
    )
    expect(updated.locale).toBe('pl')
  })

  it('defaults onboarding state when the scoped file is missing', async () => {
    const platformApi = createPlatformApiMock()

    vi.mocked(platformApi.readScopedTextFile).mockResolvedValue(undefined)

    const loaded = await readOnboardingPersistence(platformApi)

    expect(platformApi.readScopedTextFile).toHaveBeenCalledWith('onboarding')
    expect(loaded).toEqual({
      completed: false,
      currentSlide: 1,
    })
  })

  it('writes onboarding state through the onboarding scope', async () => {
    const platformApi = createPlatformApiMock()

    vi.mocked(platformApi.writeScopedTextFile).mockResolvedValue({
      content: '',
      birthtime: '2026-04-03T10:00:00.000Z',
      mtime: '2026-04-03T10:00:00.000Z',
    })

    const updated = await writeOnboardingPersistence(platformApi, {
      completed: false,
      currentSlide: 4,
      selectedImportPluginId: 'notion',
    })

    expect(platformApi.writeScopedTextFile).toHaveBeenCalledWith(
      'onboarding',
      expect.stringContaining('currentSlide: 4'),
    )
    expect(updated.selectedImportPluginId).toBe('notion')
  })

  it('resets app persistence to default config, onboarding, and empty meta', async () => {
    const platformApi = createPlatformApiMock()

    vi.mocked(platformApi.writeScopedTextFile).mockResolvedValue({
      content: '',
      birthtime: '2026-04-03T10:00:00.000Z',
      mtime: '2026-04-03T10:00:00.000Z',
    })

    const reset = await resetAppPersistence(platformApi)

    expect(platformApi.writeScopedTextFile).toHaveBeenCalledTimes(3)
    expect(platformApi.writeScopedTextFile).toHaveBeenCalledWith(
      'app-config',
      expect.stringContaining(`vault: ${loadConfig().vault}`),
    )
    expect(platformApi.writeScopedTextFile).toHaveBeenCalledWith(
      'onboarding',
      expect.stringContaining('currentSlide: 1'),
    )
    expect(platformApi.writeScopedTextFile).toHaveBeenCalledWith(
      'meta',
      expect.stringContaining('folders: {}'),
    )
    expect(reset.appConfig).toEqual(loadConfig())
    expect(reset.onboarding).toEqual({
      completed: false,
      currentSlide: 1,
    })
    expect(reset.meta).toEqual({
      folders: {},
    })
  })
})
