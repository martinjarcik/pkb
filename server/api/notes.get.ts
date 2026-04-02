import { defineEventHandler } from 'h3'
import type { NoteCatalogRow } from '~/notes/types'
import { getNoteStorage } from '~/storage/router'
import type { NoteStorage } from '~/storage/types'
import { loadServerConfig } from '../loadServerConfig'
import { purgeExpiredNotes } from '../purgeExpiredNotes'

// Mutating GET: purges expired trashed notes before returning the catalog (see docs/decisions.md).
export async function loadNotesResponse(
  storage?: NoteStorage,
): Promise<NoteCatalogRow[]> {
  const config = await loadServerConfig()
  const resolvedStorage = storage ?? getNoteStorage(config)

  await purgeExpiredNotes(
    resolvedStorage,
    config.applicationType,
    config.trashRetentionDays,
    config.vault,
  )

  return resolvedStorage.loadNotesCatalog()
}

export default defineEventHandler(async () => {
  return loadNotesResponse()
})
