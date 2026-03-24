import type { ApplicationType } from '~/config/loader'
import { browserStorage } from './browser'
import { createFilesystemStorage } from './filesystem'
import type { NoteStorage } from './types'

export type StorageConfig = {
  applicationType: ApplicationType
  vault: string
}

export function getNoteStorage(config: StorageConfig): NoteStorage {
  switch (config.applicationType) {
    case 'browser':
      return browserStorage
    case 'desktop':
      return createFilesystemStorage(config.vault)
    default:
      throw new Error(
        `Unsupported application type: ${config.applicationType as string}`,
      )
  }
}
