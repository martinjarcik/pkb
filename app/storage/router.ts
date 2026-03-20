import type { AppConfig } from '~/config/loader'
import { loadConfig } from '~/config/loader'
import { browserStorage } from './browser'
import { createFilesystemStorage } from './filesystem'
import type { NoteStorage } from './types'

export function getNoteStorage(config: AppConfig = loadConfig()): NoteStorage {
  switch (config.applicationType) {
    case 'browser':
      return browserStorage
    case 'desktop':
      return createFilesystemStorage(config.vault)
    case 'cloud':
      throw new Error('Cloud note storage is not implemented yet')
    default:
      throw new Error(
        `Unsupported application type: ${config.applicationType as string}`,
      )
  }
}
