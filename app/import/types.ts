export type CopyFilesResult = {
  files_copied: number
  files_skipped: number
}

export type ImportedNoteFile = {
  path: string
  content: string
}

export type PlatformTextFile = {
  content: string
  birthtime: string
  mtime: string
}

export type ImportResult = {
  notesCopied: number
  notesRenamed: number
  assetsCopied: number
  assetsSkipped: number
}

export type ImportPlugin = {
  id: string
  label: string
  title: string
  description: string
  documentationUrl?: string
  documentationLabel?: string
  run: (
    sourceDir: string,
    resolvedVaultPath: string,
    assetsFolder: string,
  ) => Promise<ImportResult>
}

export function joinPath(basePath: string, childPath: string): string {
  return `${basePath.replace(/[\\/]+$/, '')}/${childPath.replace(/^[\\/]+/, '')}`
}

function padTimestampPart(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatImportTimestamp(date: Date): string {
  const year = date.getFullYear()
  const month = padTimestampPart(date.getMonth() + 1)
  const day = padTimestampPart(date.getDate())
  const hours = padTimestampPart(date.getHours())
  const minutes = padTimestampPart(date.getMinutes())
  const seconds = padTimestampPart(date.getSeconds())

  return `${year}-${month}-${day} ${hours}-${minutes}-${seconds}`
}

export function buildImportLogContent(
  importLabel: string,
  sourceDir: string,
  assetsFolder: string,
  timestamp: string,
  result: ImportResult,
): string {
  return [
    '# Import log',
    '',
    `- Import: ${importLabel}`,
    `- Timestamp: ${timestamp}`,
    `- Source folder: ${sourceDir}`,
    `- Assets folder: ${assetsFolder}`,
    `- Notes copied: ${result.notesCopied}`,
    `- Notes renamed: ${result.notesRenamed}`,
    `- Assets copied: ${result.assetsCopied}`,
    `- Assets skipped: ${result.assetsSkipped}`,
    '',
  ].join('\n')
}
