import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('tauriPlatformApi', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it('keeps resolved vault contexts separate per vault path', async () => {
    const invoke = <T>(command: string, args: Record<string, unknown>) => {
      if (command === 'init_data_dir') {
        return Promise.resolve(
          '/Users/m.jarcik/Library/Application Support/com.mjarcik.notes',
        ) as Promise<T>
      }

      if (command === 'resolve_vault') {
        const dir = String(args.dir)

        if (dir === './vault') {
          return Promise.resolve(
            '/Users/m.jarcik/Library/Application Support/com.mjarcik.notes/vault',
          ) as Promise<T>
        }

        if (dir === '/Users/m.jarcik/Documents/Notes') {
          return Promise.resolve(
            '/Users/m.jarcik/Documents/Notes',
          ) as Promise<T>
        }
      }

      throw new Error(`Unexpected command: ${command}`)
    }

    const convertFileSrc = (path: string) =>
      `asset://localhost/${encodeURIComponent(path)}`

    vi.doMock('@tauri-apps/api/core', () => ({
      convertFileSrc,
      invoke,
    }))

    vi.stubGlobal('window', {
      __TAURI_INTERNALS__: {
        convertFileSrc,
        invoke,
      },
    } as unknown as Window & typeof globalThis)

    const { createTauriPlatformApi } =
      await import('~/storage/tauriPlatformApi')

    const fallbackApi = createTauriPlatformApi('./vault', 'assets')
    const notesApi = createTauriPlatformApi(
      '/Users/m.jarcik/Documents/Notes',
      'assets',
    )

    await fallbackApi.ensureReady()
    await notesApi.ensureReady()

    expect(notesApi.assetUrl('assets/test.png')).toBe(
      'asset://localhost/%2FUsers%2Fm.jarcik%2FDocuments%2FNotes%2Fassets%2Ftest.png',
    )
  })
})
