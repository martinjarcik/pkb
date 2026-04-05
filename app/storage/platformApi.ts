export type PlatformFileScope = 'app-config' | 'meta'

export type PlatformNoteFile = {
  path: string
  content: string
  birthtime: string
  mtime: string
}

export type PlatformTextFile = {
  content: string
  birthtime: string
  mtime: string
}

export type PlatformAssetUploadResult = {
  success: number
  file: { url: string }
}

export type PlatformApi = {
  readAllNotes(dir: string): Promise<PlatformNoteFile[]>
  writeTextFile(
    dir: string,
    path: string,
    content: string,
  ): Promise<PlatformTextFile>
  deleteTextFile(dir: string, path: string): Promise<void>
  renameTextFile(dir: string, oldPath: string, newPath: string): Promise<void>
  createDirectory(dir: string, path: string): Promise<void>
  renameDirectory(dir: string, oldPath: string, newPath: string): Promise<void>
  readScopedTextFile(scope: PlatformFileScope): Promise<string | undefined>
  writeScopedTextFile(
    scope: PlatformFileScope,
    content: string,
  ): Promise<PlatformTextFile>
  ensureReady(): Promise<void>
  uploadAsset(file: File): Promise<PlatformAssetUploadResult>
  assetUrl(relativePath: string): string
  markdownUrlFromAssetUrl(fileUrl: string): string
}
