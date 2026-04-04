import type {
  PlatformApi,
  PlatformAssetUploadResult,
  PlatformFileScope,
  PlatformNoteFile,
  PlatformTextFile,
} from './platformApi'

type TauriErrorPayload = {
  message?: string
}

type PrepareAssetPathResult = {
  absolute_path: string
  relative_path: string
}

type TauriCoreModule = {
  convertFileSrc: (path: string) => string
  invoke: <T>(command: string, args: Record<string, unknown>) => Promise<T>
}

function normalizeSlashes(path: string): string {
  return path.replace(/\\/g, '/')
}

function decodeAssetPathname(pathname: string): string {
  const decoded = decodeURIComponent(pathname)

  if (/^\/[A-Za-z]:\//.test(decoded)) {
    return decoded.slice(1)
  }

  return decoded.replace(/^\/\/+/, '/')
}

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }

  if (typeof error === 'string' && error.length > 0) {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    const payload = error as TauriErrorPayload

    if (typeof payload.message === 'string' && payload.message.length > 0) {
      return payload.message
    }
  }

  return 'Request failed'
}

let tauriCore: TauriCoreModule | null = null

async function loadTauriCore(): Promise<TauriCoreModule> {
  if (tauriCore !== null) {
    return tauriCore
  }

  tauriCore = (await import('@tauri-apps/api/core')) as TauriCoreModule

  return tauriCore
}

async function callTauri<T>(
  command: string,
  args: Record<string, unknown>,
): Promise<T> {
  try {
    const { invoke } = await loadTauriCore()

    return await invoke<T>(command, args)
  } catch (error) {
    throw new Error(parseErrorMessage(error))
  }
}

async function writeFileViaPlugin(
  absolutePath: string,
  data: Uint8Array,
): Promise<void> {
  const { writeFile } = await import('@tauri-apps/plugin-fs')

  await writeFile(absolutePath, data)
}

type ResolvedContext = {
  absoluteVault: string
  convertFileSrc: (path: string) => string
}

let resolvedCtx: ResolvedContext | null = null
let resolvePromise: Promise<ResolvedContext> | null = null

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

function resolveContext(vaultPath: string): Promise<ResolvedContext> {
  if (resolvedCtx !== null) {
    return Promise.resolve(resolvedCtx)
  }

  if (resolvePromise !== null) {
    return resolvePromise
  }

  resolvePromise = (async () => {
    const core = await loadTauriCore()
    const absoluteVault = await callTauri<string>('resolve_vault', {
      dir: vaultPath,
    })

    resolvedCtx = { absoluteVault, convertFileSrc: core.convertFileSrc }

    return resolvedCtx
  })()

  return resolvePromise
}

function toAssetUrl(ctx: ResolvedContext, absoluteFilePath: string): string {
  return ctx.convertFileSrc(absoluteFilePath)
}

function assetUrlForRelative(
  ctx: ResolvedContext,
  relativePath: string,
): string {
  const cleaned = normalizeSlashes(relativePath).replace(/^\/+/, '')

  return toAssetUrl(ctx, `${ctx.absoluteVault}/${cleaned}`)
}

function stripVaultPrefix(absoluteVault: string, fileUrl: string): string {
  try {
    const url = new URL(fileUrl)
    const absolutePath = normalizeSlashes(decodeAssetPathname(url.pathname))
    const prefix = normalizeSlashes(absoluteVault).replace(/\/+$/, '') + '/'

    if (absolutePath.startsWith(prefix)) {
      return absolutePath.slice(prefix.length)
    }
  } catch {
    // Fall back to the input string when the URL is not a valid asset URL.
  }

  return fileUrl
}

export function createTauriPlatformApi(
  vaultPath: string,
  assetsFolder: string,
): PlatformApi {
  if (isTauriEnvironment()) {
    void resolveContext(vaultPath)
  }

  return {
    async readAllNotes(dir: string): Promise<PlatformNoteFile[]> {
      return callTauri<PlatformNoteFile[]>('read_all_notes', { dir })
    },

    async writeTextFile(
      dir: string,
      path: string,
      content: string,
    ): Promise<PlatformTextFile> {
      return callTauri<PlatformTextFile>('write_text_file', {
        dir,
        path,
        content,
      })
    },

    async deleteTextFile(dir: string, path: string): Promise<void> {
      await callTauri<void>('delete_text_file', { dir, path })
    },

    async renameTextFile(
      dir: string,
      oldPath: string,
      newPath: string,
    ): Promise<void> {
      await callTauri<void>('rename_text_file', { dir, oldPath, newPath })
    },

    async createDirectory(dir: string, path: string): Promise<void> {
      await callTauri<void>('create_directory', { dir, path })
    },

    async renameDirectory(
      dir: string,
      oldPath: string,
      newPath: string,
    ): Promise<void> {
      await callTauri<void>('rename_directory', { dir, oldPath, newPath })
    },

    async readScopedTextFile(
      scope: PlatformFileScope,
    ): Promise<string | undefined> {
      const file = await callTauri<PlatformTextFile | null>(
        'read_scoped_text_file',
        {
          scope,
          vaultPath,
        },
      )

      return file?.content
    },

    async writeScopedTextFile(
      scope: PlatformFileScope,
      content: string,
    ): Promise<PlatformTextFile> {
      return callTauri<PlatformTextFile>('write_scoped_text_file', {
        scope,
        content,
        vaultPath,
      })
    },

    async uploadAsset(file: File): Promise<PlatformAssetUploadResult> {
      const ctx = await resolveContext(vaultPath)
      const pathResult = await callTauri<PrepareAssetPathResult>(
        'prepare_asset_path',
        {
          vaultPath,
          assetsFolder,
          fileName: file.name,
          mimeType: file.type,
        },
      )

      const buffer = await file.arrayBuffer()

      await writeFileViaPlugin(pathResult.absolute_path, new Uint8Array(buffer))

      return {
        success: 1,
        file: {
          url: toAssetUrl(ctx, pathResult.absolute_path),
        },
      }
    },

    assetUrl(relativePath: string): string {
      if (resolvedCtx === null) {
        return relativePath
      }

      return assetUrlForRelative(resolvedCtx, relativePath)
    },

    markdownUrlFromAssetUrl(fileUrl: string): string {
      if (resolvedCtx === null) {
        return fileUrl
      }

      return stripVaultPrefix(resolvedCtx.absoluteVault, fileUrl)
    },
  }
}
