import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpPlatformApi } from '~/storage/httpPlatformApi'

describe('httpPlatformApi', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads all notes from the filesystem proxy files route', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    await httpPlatformApi.readAllNotes('/vault')

    expect(fetchMock).toHaveBeenCalledWith('/api/fs/files?dir=%2Fvault')
  })

  it('writes text files through the filesystem proxy file route', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: '# Body',
        birthtime: '2026-04-03T10:00:00.000Z',
        mtime: '2026-04-03T10:00:00.000Z',
      }),
    } as Response)

    await httpPlatformApi.writeTextFile('/vault', 'note.md', '# Body')

    expect(fetchMock).toHaveBeenCalledWith('/api/fs/file', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dir: '/vault',
        path: 'note.md',
        content: '# Body',
      }),
    })
  })

  it('reads scoped text files through the filesystem proxy file route', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: 'locale: en',
        birthtime: '2026-04-03T10:00:00.000Z',
        mtime: '2026-04-03T10:00:00.000Z',
      }),
    } as Response)

    const content = await httpPlatformApi.readScopedTextFile('app-config')

    expect(content).toBe('locale: en')
    expect(fetchMock).toHaveBeenCalledWith('/api/fs/file?scope=app-config')
  })

  it('returns the prefixed asset url for vault assets', () => {
    expect(httpPlatformApi.assetUrl('assets/image.png')).toBe(
      '/api/vault-assets/assets/image.png',
    )
  })

  it('strips the http asset prefix when serializing markdown image urls', () => {
    expect(
      httpPlatformApi.markdownUrlFromAssetUrl(
        '/api/vault-assets/assets/image.png',
      ),
    ).toBe('assets/image.png')
  })

  it('uploads assets through the vault assets route', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: 1,
        file: { url: '/api/vault-assets/assets/image.png' },
      }),
    } as Response)

    const file = new File(['img'], 'image.png', { type: 'image/png' })

    await httpPlatformApi.uploadAsset(file)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/vault-assets/upload')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
    })
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBeInstanceOf(FormData)
  })
})
