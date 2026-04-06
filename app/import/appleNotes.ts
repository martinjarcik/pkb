import { invoke } from '@tauri-apps/api/core'
import { noteTitleFromId } from '~/notes/noteTitleFromId'
import { resolveUniqueNoteIdForParentPath } from '~/notes/noteId'

type CopyFilesResult = {
  files_copied: number
  files_skipped: number
}

type ImportedNoteFile = {
  path: string
  content: string
}

type PlatformTextFile = {
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

function joinPath(basePath: string, childPath: string): string {
  return `${basePath.replace(/[\\/]+$/, '')}/${childPath.replace(/^[\\/]+/, '')}`
}

function rewriteAttachmentLinks(content: string, assetsFolder: string): string {
  return content.replace(
    /(\]\(<?)Attachments\//g,
    `$1${assetsFolder.replace(/[\\/]+$/, '')}/`,
  )
}

function padTimestampPart(value: number): string {
  return String(value).padStart(2, '0')
}

function formatImportTimestamp(date: Date): string {
  const year = date.getFullYear()
  const month = padTimestampPart(date.getMonth() + 1)
  const day = padTimestampPart(date.getDate())
  const hours = padTimestampPart(date.getHours())
  const minutes = padTimestampPart(date.getMinutes())
  const seconds = padTimestampPart(date.getSeconds())

  return `${year}-${month}-${day} ${hours}-${minutes}-${seconds}`
}

function buildImportLogContent(
  sourceDir: string,
  assetsFolder: string,
  timestamp: string,
  result: ImportResult,
): string {
  return [
    '# Import log',
    '',
    `- Import: Apple Notes`,
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

    const result = {
      notesCopied,
      notesRenamed,
      assetsCopied: assetsResult.files_copied,
      assetsSkipped: assetsResult.files_skipped,
    }

    const importLogTitle = `${importTimestamp} import ${appleNotesPlugin.label}`
    const importLogId = resolveUniqueNoteIdForParentPath(
      '',
      importLogTitle,
      existingIds,
    )

    await invoke<PlatformTextFile>('write_text_file', {
      dir: resolvedVaultPath,
      path: importLogId,
      content: buildImportLogContent(
        sourceDir,
        assetsFolder,
        importTimestamp,
        result,
      ),
    })

    return result
  },
}
