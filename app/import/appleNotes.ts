import { invoke } from '@tauri-apps/api/core'
import { noteTitleFromId } from '~/notes/noteTitleFromId'
import { resolveUniqueNoteIdForParentPath } from '~/notes/noteId'
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

function rewriteAttachmentLinks(content: string, assetsFolder: string): string {
  return content.replace(
    /(\]\(<?)Attachments\//g,
    `$1${assetsFolder.replace(/[\\/]+$/, '')}/`,
  )
}

export const appleNotesPlugin: ImportPlugin = {
  id: 'apple-notes',
  label: 'Apple Notes',
  title: 'Import from Apple Notes',
  description:
    'Select the folder containing your exported Apple Notes markdown files. Markdown files from the selected folder are copied to the vault root, and files from the Attachments folder are copied to the configured assets folder.',
  async run(
    sourceDir: string,
    resolvedVaultPath: string,
    assetsFolder: string,
  ): Promise<ImportResult> {
    const importTimestamp = formatImportTimestamp(new Date())
    const [sourceNotes, vaultNotes] = await Promise.all([
      invoke<ImportedNoteFile[]>('read_all_notes', {
        dir: sourceDir,
      }),
      invoke<ImportedNoteFile[]>('read_all_notes', {
        dir: resolvedVaultPath,
      }),
    ])

    const existingIds = new Set(vaultNotes.map((note) => note.path))
    let notesCopied = 0
    let notesRenamed = 0

    for (const note of sourceNotes) {
      const title = noteTitleFromId(note.path)
      const defaultId = resolveUniqueNoteIdForParentPath('', title, [])
      const uniqueId = resolveUniqueNoteIdForParentPath('', title, existingIds)
      const rewrittenContent = rewriteAttachmentLinks(
        note.content,
        assetsFolder,
      )

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

    const assetsResult = await invoke<CopyFilesResult>('copy_files', {
      sourceDir: joinPath(sourceDir, 'Attachments'),
      targetDir: joinPath(resolvedVaultPath, assetsFolder),
      excludeExtensions: ['DS_Store'],
    })

    const result: ImportResult = {
      notesCopied,
      notesRenamed,
      assetsCopied: assetsResult.files_copied,
      assetsSkipped: assetsResult.files_skipped,
    }

    const importLogTitle = `${importTimestamp} import ${appleNotesPlugin.label}`
    const importLogId = resolveUniqueImportLogPath(importLogTitle, existingIds)

    await invoke<PlatformTextFile>('write_text_file', {
      dir: resolvedVaultPath,
      path: importLogId,
      content: buildImportLogContent(
        appleNotesPlugin.label,
        sourceDir,
        assetsFolder,
        importTimestamp,
        result,
      ),
    })

    return result
  },
}
