import type { ApplicationType } from '~/config/loader'
import { browserStorage } from './browser'
import { createFilesystemProxyStorage } from './filesystemProxy'
import type { PlatformApi } from './platformApi'
import type { NoteStorage } from './types'

export type StorageConfig = {
  applicationType: ApplicationType
  platformApi: PlatformApi | null
  vault: string
}

export function getNoteStorage(config: StorageConfig): NoteStorage {
  switch (config.applicationType) {
    case 'browser':
      return browserStorage
    case 'desktop':
      if (config.platformApi === null) {
        throw new Error('Platform API is required for desktop storage')
      }

      return createFilesystemProxyStorage(config.platformApi, config.vault)
    default:
      throw new Error(
        `Unsupported application type: ${config.applicationType as string}`,
      )
  }
}
