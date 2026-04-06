import { invoke } from '@tauri-apps/api/core'
import { resolveUniqueNoteIdForParentPath, splitNoteId } from '~/notes/noteId'
import {
  buildImportLogContent,
  formatImportTimestamp,
  joinPath,
  type CopyFilesResult,
  type ImportPlugin,
  type ImportResult,
  type PlatformTextFile,
  type TextFile,
  resolveUniqueImportLogPath,
} from './types'

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function fileExtension(path: string): string {
  const dotIndex = path.lastIndexOf('.')

  if (dotIndex === -1) {
    return ''
  }

  return path.slice(dotIndex + 1).toLowerCase()
}

function sourceTitleFromPath(path: string): string {
  const normalizedPath = path.replace(/\\/g, '/')
  const baseName = normalizedPath.slice(normalizedPath.lastIndexOf('/') + 1)
  const dotIndex = baseName.lastIndexOf('.')

  if (dotIndex === -1) {
    return baseName
  }

  return baseName.slice(0, dotIndex)
}

export function stripNotionSourceSuffix(title: string): string {
  const stripped = title.replace(/\s+\S+$/, '')

  return stripped.length > 0 ? stripped : title
}

function isPathInsideAssetDirectory(
  filePath: string,
  assetDirectories: Set<string>,
): boolean {
  for (const assetDirectory of assetDirectories) {
    if (
      filePath === assetDirectory ||
      filePath.startsWith(`${assetDirectory}/`)
    ) {
      return true
    }
  }

  return false
}

function buildAssetFoldersByParentPath(
  assetDirectories: Set<string>,
): Map<string, Set<string>> {
  const directoriesByParentPath = new Map<string, Set<string>>()

  for (const directory of assetDirectories) {
    const { parentPath } = splitNoteId(directory)
    const directoryName = parentPath
      ? directory.slice(parentPath.length + 1)
      : directory
    const existing =
      directoriesByParentPath.get(parentPath) ?? new Set<string>()

    existing.add(directoryName)
    directoriesByParentPath.set(parentPath, existing)
  }

  return directoriesByParentPath
}

function expandAssetFolderNames(assetFolderNames: Set<string>): string[] {
  const variants = new Set<string>()

  for (const folderName of assetFolderNames) {
    variants.add(folderName)
    variants.add(encodeURIComponent(folderName))
  }

  return Array.from(variants)
}

export function rewriteAssetLinks(
  content: string,
  assetsFolder: string,
  assetFolderNames: Set<string>,
): string {
  if (assetFolderNames.size === 0) {
    return content
  }

  const trimmed = assetsFolder.replace(/[\\/]+$/, '')
  const escapedFolderNames = expandAssetFolderNames(assetFolderNames)
    .map(escapeRegex)
    .join('|')
  const pattern = new RegExp(
    `(\\]\\(<?)(?:${escapedFolderNames})/([^\\r\\n)>]+)`,
    'g',
  )

  return content.replace(pattern, (_, prefix: string, assetPath: string) => {
    const fileName = assetPath.slice(assetPath.lastIndexOf('/') + 1)
    return `${prefix}${trimmed}/${fileName}`
  })
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentValue = ''
  let index = 0
  let isQuoted = false

  while (index < content.length) {
    const character = content[index]
    const nextCharacter = content[index + 1]

    if (character === '"') {
      if (isQuoted && nextCharacter === '"') {
        currentValue += '"'
        index += 2
        continue
      }

      isQuoted = !isQuoted
      index += 1
      continue
    }

    if (!isQuoted && character === ',') {
      currentRow.push(currentValue)
      currentValue = ''
      index += 1
      continue
    }

    if (!isQuoted && (character === '\n' || character === '\r')) {
      currentRow.push(currentValue)
      rows.push(currentRow)
      currentRow = []
      currentValue = ''
      index += character === '\r' && nextCharacter === '\n' ? 2 : 1
      continue
    }

    currentValue += character
    index += 1
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue)
    rows.push(currentRow)
  }

  return rows
}

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
}

function csvToMarkdownTable(content: string): string {
  const rows = parseCsvRows(content)

  if (rows.length === 0) {
    return ''
  }

  const columnCount = Math.max(...rows.map((row) => row.length))
  const normalizedRows = rows.map((row) =>
    Array.from({ length: columnCount }, (_, index) =>
      escapeMarkdownTableCell(row[index] ?? ''),
    ),
  )
  const header = normalizedRows[0]
  const separator = Array.from({ length: columnCount }, () => '---')
  const tableRows = [header, separator, ...normalizedRows.slice(1)]

  return tableRows.map((row) => `| ${row.join(' | ')} |`).join('\n')
}

function classifyAssetDirectories(
  sourceFiles: TextFile[],
  sourceDirectories: string[],
): Set<string> {
  const directoriesWithTextFiles = new Set(
    sourceFiles.map((file) => splitNoteId(file.path).parentPath),
  )

  return new Set(
    sourceDirectories.filter(
      (directory) => !directoriesWithTextFiles.has(directory),
    ),
  )
}

export const notionPlugin: ImportPlugin = {
  id: 'notion',
  label: 'Notion',
  title: 'Import from Notion',
  description:
    'Select the folder containing your Notion export. Markdown files keep their folder structure, CSV files are converted into Markdown tables, and assets are copied flat into the configured assets folder.',
  async run(
    sourceDir: string,
    resolvedVaultPath: string,
    assetsFolder: string,
  ): Promise<ImportResult> {
    const importTimestamp = formatImportTimestamp(new Date())
    const [sourceFiles, vaultNotes, sourceDirectories] = await Promise.all([
      invoke<TextFile[]>('read_text_files', {
        dir: sourceDir,
        extensions: ['md', 'csv'],
      }),
      invoke<TextFile[]>('read_all_notes', { dir: resolvedVaultPath }),
      invoke<string[]>('list_directories', { dir: sourceDir }),
    ])

    const assetDirectories = classifyAssetDirectories(
      sourceFiles,
      sourceDirectories,
    )
    const assetFoldersByParentPath =
      buildAssetFoldersByParentPath(assetDirectories)
    const existingIds = new Set(vaultNotes.map((note) => note.path))
    const filesToImport = sourceFiles.filter(
      (file) => !isPathInsideAssetDirectory(file.path, assetDirectories),
    )
    let notesCopied = 0
    let notesRenamed = 0

    for (const file of filesToImport) {
      const { parentPath } = splitNoteId(file.path)
      const extension = fileExtension(file.path)
      const title = stripNotionSourceSuffix(sourceTitleFromPath(file.path))
      const defaultId = resolveUniqueNoteIdForParentPath(parentPath, title, [])
      const uniqueId = resolveUniqueNoteIdForParentPath(
        parentPath,
        title,
        existingIds,
      )
      const content =
        extension === 'csv'
          ? csvToMarkdownTable(file.content)
          : rewriteAssetLinks(
              file.content,
              assetsFolder,
              assetFoldersByParentPath.get(parentPath) ?? new Set<string>(),
            )

      await invoke<PlatformTextFile>('write_text_file', {
        dir: resolvedVaultPath,
        path: uniqueId,
        content,
      })

      existingIds.add(uniqueId)
      notesCopied += 1

      if (uniqueId !== defaultId) {
        notesRenamed += 1
      }
    }

    let assetsCopied = 0
    let assetsSkipped = 0

    for (const relativeDir of assetDirectories) {
      const copyResult = await invoke<CopyFilesResult>('copy_files', {
        sourceDir: joinPath(sourceDir, relativeDir),
        targetDir: joinPath(resolvedVaultPath, assetsFolder),
        excludeExtensions: ['md', 'csv', 'DS_Store'],
      })

      assetsCopied += copyResult.files_copied
      assetsSkipped += copyResult.files_skipped
    }

    const result: ImportResult = {
      notesCopied,
      notesRenamed,
      assetsCopied,
      assetsSkipped,
    }
    const importLogTitle = `${importTimestamp} import ${notionPlugin.label}`
    const importLogId = resolveUniqueImportLogPath(importLogTitle, existingIds)

    await invoke<PlatformTextFile>('write_text_file', {
      dir: resolvedVaultPath,
      path: importLogId,
      content: buildImportLogContent(
        notionPlugin.label,
        sourceDir,
        assetsFolder,
        importTimestamp,
        result,
      ),
    })

    return result
  },
}
