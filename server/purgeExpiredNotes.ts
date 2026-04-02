import type { NoteCatalogRow } from '~/notes/types'
import { catalogRowIsTrashed, trashExpired } from '~/notes/trash'
import type { NoteStorage } from '~/storage/types'
import { extractLocalImageRefs } from '~/storage/imageRefs'
import { deleteOrphanedAssetFiles } from './deleteOrphanedAssetFiles'

function expiredTrashedRows(
  catalog: NoteCatalogRow[],
  retentionDays: number,
  now: Date,
): NoteCatalogRow[] {
  return catalog.filter(
    (row) =>
      catalogRowIsTrashed(row) &&
      typeof row.trashedAt === 'string' &&
      trashExpired(row.trashedAt, retentionDays, now),
  )
}

export async function purgeExpiredNotes(
  storage: NoteStorage,
  applicationType: 'desktop' | 'browser',
  retentionDays: number,
  vaultPath: string,
  catalog: NoteCatalogRow[],
): Promise<NoteCatalogRow[]> {
  const now = new Date()
  const expiredRows = expiredTrashedRows(catalog, retentionDays, now)

  if (expiredRows.length === 0) {
    return catalog
  }

  const expiredIds = new Set(expiredRows.map((row) => row.id))

  if (applicationType !== 'desktop') {
    await Promise.all(expiredRows.map((row) => storage.deleteNote(row.id)))

    return catalog.filter((row) => !expiredIds.has(row.id))
  }

  for (const row of expiredRows) {
    const note = await storage.loadNoteById(row.id)
    const refs = note ? [...extractLocalImageRefs(note.content)] : []

    await storage.deleteNote(row.id)

    if (refs.length > 0) {
      void deleteOrphanedAssetFiles(vaultPath, refs)
    }
  }

  return catalog.filter((row) => !expiredIds.has(row.id))
}
