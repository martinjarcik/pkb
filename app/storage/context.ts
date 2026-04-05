import type { StorageType } from '~/config/parseAppConfig'
import { getPlatformApi } from './platformRouter'
import { getNoteStorage } from './router'
import type { PlatformApi } from './platformApi'
import type { NoteStorage } from './types'

export type StorageContextConfig = {
  storageType: StorageType
  vault: string
  assetsFolder: string
}

export type StorageContext = {
  platformApi: PlatformApi
  storage: NoteStorage
}

export function createStorageContext(
  config: StorageContextConfig,
): StorageContext {
  const platformApi = getPlatformApi(
    config.storageType,
    config.vault,
    config.assetsFolder,
  )

  return {
    platformApi,
    storage: getNoteStorage({
      storageType: config.storageType,
      platformApi,
      vault: config.vault,
    }),
  }
}
