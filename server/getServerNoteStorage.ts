import { getNoteStorage, type StorageConfig } from '~/storage/router'
import type { NoteStorage } from '~/storage/types'
import { getCachedFilesystemStorage } from './noteCache'

export function getServerNoteStorage(config: StorageConfig): NoteStorage {
  if (config.applicationType !== 'desktop') {
    return getNoteStorage(config)
  }

  return getCachedFilesystemStorage(config.vault)
}
