import { invoke } from '@tauri-apps/api/core'
import { resolveUniqueNoteIdForParentPath, splitNoteId } from '~/notes/noteId'
import { noteTitleFromId } from '~/notes/noteTitleFromId'
import {
  buildImportLogContent,
  formatImportTimestamp,
  joinPath,
  type CopyFilesResult,
  type ImportedNoteFile,
  type ImportPlugin,
  type ImportResult,
  type PlatformTextFile,
  resolveUniqueImportLogPath,
} from './types'

const RESERVED_ASSET_FOLDERS = new Set(['images', 'attachments'])

function isReservedPath(notePath: string): boolean {
  return notePath
    .split('/')
    .some((segment) => RESERVED_ASSET_FOLDERS.has(segment.toLowerCase()))
}

function isReservedDirectory(directoryPath: string): boolean {
  const segments = directoryPath.split('/')
  const lastSegment = segments[segments.length - 1]

  return (
    lastSegment !== undefined &&
    RESERVED_ASSET_FOLDERS.has(lastSegment.toLowerCase())
  )
}

function rewriteAssetLinks(content: string, assetsFolder: string): string {
  const trimmed = assetsFolder.replace(/[\\/]+$/, '')

  return content.replace(/(\]\(<?)(?:images|attachments)\//gi, `$1${trimmed}/`)
}

export const appleNotesExporterPlugin: ImportPlugin = {
  id: 'apple-notes-exporter',
  label: 'Apple Notes via Exporter',
  title: 'Import from Apple Notes via Exporter',
  description:
    'Select the folder containing your Apple Notes Exporter output. Notes are imported preserving their folder structure. Files from images and attachments folders are copied flat into the configured assets folder.',
  async run(
    sourceDir: string,
    resolvedVaultPath: string,
    assetsFolder: string,
  ): Promise<ImportResult> {
    const importTimestamp = formatImportTimestamp(new Date())

    const [sourceNotes, vaultNotes, sourceDirectories] = await Promise.all([
      invoke<ImportedNoteFile[]>('read_all_notes', { dir: sourceDir }),
      invoke<ImportedNoteFile[]>('read_all_notes', { dir: resolvedVaultPath }),
      invoke<string[]>('list_directories', { dir: sourceDir }),
    ])

    const existingIds = new Set(vaultNotes.map((note) => note.path))
    let notesCopied = 0
    let notesRenamed = 0

    const filteredNotes = sourceNotes.filter(
      (note) => !isReservedPath(note.path),
    )

    for (const note of filteredNotes) {
      const { parentPath } = splitNoteId(note.path)
      const title = noteTitleFromId(note.path)
      const defaultId = resolveUniqueNoteIdForParentPath(parentPath, title, [])
      const uniqueId = resolveUniqueNoteIdForParentPath(
        parentPath,
        title,
        existingIds,
      )
      const rewrittenContent = rewriteAssetLinks(note.content, assetsFolder)

      await invoke<PlatformTextFile>('write_text_file', {
        dir: resolvedVaultPath,
        path: uniqueId,
        content: rewrittenContent,
      })

      existingIds.add(uniqueId)
      notesCopied += 1

      if (uniqueId !== defaultId) {
        notesRenamed += 1
      }
    }

    const assetDirectories = sourceDirectories.filter(isReservedDirectory)
    let totalAssetsCopied = 0
    let totalAssetsSkipped = 0

    for (const relativeDir of assetDirectories) {
      const copyResult = await invoke<CopyFilesResult>('copy_files', {
        sourceDir: joinPath(sourceDir, relativeDir),
        targetDir: joinPath(resolvedVaultPath, assetsFolder),
        excludeExtensions: ['DS_Store'],
      })

      totalAssetsCopied += copyResult.files_copied
      totalAssetsSkipped += copyResult.files_skipped
    }

    const result: ImportResult = {
      notesCopied,
      notesRenamed,
      assetsCopied: totalAssetsCopied,
      assetsSkipped: totalAssetsSkipped,
    }

    const importLogTitle = `${importTimestamp} import ${appleNotesExporterPlugin.label}`
    const importLogId = resolveUniqueImportLogPath(importLogTitle, existingIds)

    await invoke<PlatformTextFile>('write_text_file', {
      dir: resolvedVaultPath,
      path: importLogId,
      content: buildImportLogContent(
        appleNotesExporterPlugin.label,
        sourceDir,
        assetsFolder,
        importTimestamp,
        result,
      ),
    })

    return result
  },
}
