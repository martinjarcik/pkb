import { defineEventHandler } from 'h3'
import type { NoteCatalogRow } from '~/notes/types'
import { catalogRowIsTrashed, trashExpired } from '~/notes/trash'
import { extractLocalImageRefs } from '~/storage/imageRefs'
import { getNoteStorage } from '~/storage/router'
import type { NoteStorage } from '~/storage/types'
import { deleteOrphanedAssetFiles } from '../deleteOrphanedAssetFiles'
import { loadServerConfig } from '../loadServerConfig'

// Mutating GET: purges expired trashed notes before returning the catalog (see docs/decisions.md).
export async function loadNotesResponse(
  storage?: NoteStorage,
): Promise<NoteCatalogRow[]> {
  const config = await loadServerConfig()
  const resolvedStorage = storage ?? getNoteStorage(config)

  if (config.applicationType === 'desktop') {
    await purgeExpiredTrashedNotesWithAssetCleanup(
      resolvedStorage,
      config.trashRetentionDays,
      config.vault,
    )
  } else {
    await resolvedStorage.purgeExpiredTrashedNotes(config.trashRetentionDays)
  }

  return resolvedStorage.loadNotesCatalog()
}

async function purgeExpiredTrashedNotesWithAssetCleanup(
  storage: NoteStorage,
  retentionDays: number,
  vaultPath: string,
): Promise<void> {
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

export default defineEventHandler(async () => {
  return loadNotesResponse()
})
