import type { StorageType } from '~/config/parseAppConfig'
import { createFilesystemProxyStorage } from './filesystemProxy'
import type { PlatformApi } from './platformApi'
import type { NoteStorage } from './types'

export type StorageConfig = {
  storageType: StorageType
  platformApi: PlatformApi
  vault: string
}

export function getNoteStorage(config: StorageConfig): NoteStorage {
  switch (config.storageType) {
    case 'filesystem':
      return createFilesystemProxyStorage(config.platformApi, config.vault)
    default:
      throw new Error(
        `Unsupported storage type: ${config.storageType as string}`,
      )
  }
}
