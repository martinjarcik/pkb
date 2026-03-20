import type { AppConfig } from '~/config/loader'
import { loadConfig } from '~/config/loader'
import { browserStorage } from './browser'
import { createFilesystemStorage } from './filesystem'
import type { NoteStorage } from './types'

export function getNoteStorage(config?: AppConfig): NoteStorage {
  const resolvedConfig = config ?? loadConfig()

  switch (resolvedConfig.applicationType) {
    case 'browser':
      return browserStorage
    case 'desktop':
      return createFilesystemStorage(resolvedConfig.vault)
    default:
      throw new Error(
        `Unsupported application type: ${resolvedConfig.applicationType as string}`,
      )
  }
}
