import type { StorageType } from '~/config/loader'
import { createFilesystemProxyStorage } from './filesystemProxy'
import type { PlatformApi } from './platformApi'
import type { NoteStorage } from './types'

export type StorageConfig = {
  storageType: StorageType
  platformApi: PlatformApi | null
  vault: string
}

export function getNoteStorage(config: StorageConfig): NoteStorage {
  switch (config.storageType) {
    case 'filesystem':
      if (config.platformApi === null) {
        throw new Error('Platform API is required for filesystem storage')
      }

      return createFilesystemProxyStorage(config.platformApi, config.vault)
    case 'database':
      throw new Error('Database storage is not yet implemented')
    default:
      throw new Error(
        `Unsupported storage type: ${config.storageType as string}`,
      )
  }
}
