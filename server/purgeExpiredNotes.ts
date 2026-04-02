import { catalogRowIsTrashed, trashExpired } from '~/notes/trash'
import type { NoteStorage } from '~/storage/types'
import { extractLocalImageRefs } from '~/storage/imageRefs'
import { deleteOrphanedAssetFiles } from './deleteOrphanedAssetFiles'

export async function purgeExpiredNotes(
  storage: NoteStorage,
  applicationType: 'desktop' | 'browser',
  retentionDays: number,
  vaultPath: string,
): Promise<void> {
  if (applicationType !== 'desktop') {
    await storage.purgeExpiredTrashedNotes(retentionDays)
    return
  }

  const now = new Date()
  const catalog = await storage.loadNotesCatalog()
  const expiredIds = catalog
    .filter(
      (row) =>
        catalogRowIsTrashed(row) &&
        typeof row.trashedAt === 'string' &&
        trashExpired(row.trashedAt, retentionDays, now),
    )
    .map((row) => row.id)

  for (const id of expiredIds) {
    const note = await storage.loadNoteById(id)
    const refs = note ? [...extractLocalImageRefs(note.content)] : []

    await storage.deleteNote(id)

    if (refs.length > 0) {
      void deleteOrphanedAssetFiles(vaultPath, refs)
    }
  }
}
