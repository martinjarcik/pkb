import type {
  PlatformApi,
  PlatformAssetUploadResult,
  PlatformFileScope,
  PlatformNoteFile,
  PlatformTextFile,
} from './platformApi'

export const VAULT_ASSETS_API_PREFIX = '/api/vault-assets'

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText

    try {
      const body = await response.json()

      if (
        typeof body === 'object' &&
        body !== null &&
        typeof (body as Record<string, unknown>).statusMessage === 'string'
      ) {
        message = (body as Record<string, string>).statusMessage ?? message
      }
    } catch {
      // Keep the HTTP status text fallback.
    }

    throw new Error(message || 'Request failed')
  }

  return (await response.json()) as T
}

function queryString(params: Record<string, string>): string {
  return new URLSearchParams(params).toString()
}

async function readScopedTextFile(
  scope: PlatformFileScope,
): Promise<string | undefined> {
  const file = await parseResponse<PlatformTextFile | null>(
    await fetch(`/api/fs/file?${queryString({ scope })}`),
  )

  return file?.content
}

async function writeScopedTextFile(
  scope: PlatformFileScope,
  content: string,
): Promise<PlatformTextFile> {
  return parseResponse<PlatformTextFile>(
    await fetch('/api/fs/file', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scope, content }),
    }),
  )
}

async function uploadAsset(file: File): Promise<PlatformAssetUploadResult> {
  const form = new FormData()

  form.append('image', file)

  return parseResponse<PlatformAssetUploadResult>(
    await fetch('/api/vault-assets/upload', {
      method: 'POST',
      body: form,
    }),
  )
}

export const httpPlatformApi: PlatformApi = {
  async readAllNotes(dir: string): Promise<PlatformNoteFile[]> {
    return parseResponse<PlatformNoteFile[]>(
      await fetch(`/api/fs/files?${queryString({ dir })}`),
    )
  },

  async writeTextFile(
    dir: string,
    path: string,
    content: string,
  ): Promise<PlatformTextFile> {
    return parseResponse<PlatformTextFile>(
      await fetch('/api/fs/file', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dir, path, content }),
      }),
    )
  },

  async deleteTextFile(dir: string, path: string): Promise<void> {
    await parseResponse<{ ok: true }>(
      await fetch(`/api/fs/file?${queryString({ dir, path })}`, {
        method: 'DELETE',
      }),
    )
  },

  async renameTextFile(
    dir: string,
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    await parseResponse<{ ok: true }>(
      await fetch('/api/fs/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dir, oldPath, newPath }),
      }),
    )
  },

  async createDirectory(dir: string, path: string): Promise<void> {
    await parseResponse<{ ok: true }>(
      await fetch('/api/fs/dir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dir, path }),
      }),
    )
  },

  async renameDirectory(
    dir: string,
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    await parseResponse<{ ok: true }>(
      await fetch('/api/fs/rename-dir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dir, oldPath, newPath }),
      }),
    )
  },

  readScopedTextFile,
  writeScopedTextFile,
  uploadAsset,

  assetUrl(relativePath: string): string {
    return `${VAULT_ASSETS_API_PREFIX}/${relativePath}`
  },

  markdownUrlFromAssetUrl(fileUrl: string): string {
    const prefix = `${VAULT_ASSETS_API_PREFIX}/`

    return fileUrl.startsWith(prefix) ? fileUrl.slice(prefix.length) : fileUrl
  },
}
