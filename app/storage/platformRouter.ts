import type { StorageType } from '~/config/loader'
import { httpPlatformApi } from './httpPlatformApi'
import type { PlatformApi } from './platformApi'

export function getPlatformApi(storageType: StorageType): PlatformApi | null {
  switch (storageType) {
    case 'filesystem':
      return httpPlatformApi
    case 'database':
      return null
    default:
      throw new Error(`Unsupported storage type: ${storageType as string}`)
  }
}
