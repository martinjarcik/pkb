import { defineEventHandler } from 'h3'
import type { NoteCatalogRow } from '~/notes/types'
import { getNoteStorage } from '~/storage/router'
import type { NoteStorage } from '~/storage/types'
import { loadServerConfig, type ServerLoadedConfig } from '../loadServerConfig'
import { purgeExpiredNotes } from '../purgeExpiredNotes'

const PURGE_INTERVAL_MS = 60_000
let lastPurgeTimestamp = 0

// Mutating GET: purges expired trashed notes before returning the catalog (see docs/decisions.md).
export async function loadNotesResponse(
  storage?: NoteStorage,
  configOverride?: ServerLoadedConfig,
): Promise<NoteCatalogRow[]> {
  const config = configOverride ?? (await loadServerConfig())
  const resolvedStorage = storage ?? getNoteStorage(config)
  const catalog = await resolvedStorage.loadNotesCatalog()
  const now = Date.now()

  if (now - lastPurgeTimestamp < PURGE_INTERVAL_MS) {
    return catalog
  }

  const nextCatalog = await purgeExpiredNotes(
    resolvedStorage,
    config.applicationType,
    config.trashRetentionDays,
    config.vault,
    catalog,
  )

  lastPurgeTimestamp = now

  return nextCatalog
}

export default defineEventHandler(async () => {
  return loadNotesResponse()
})
