import type { StorageType } from '~/config/loader'
import type { PlatformApi } from './platformApi'
import { createTauriPlatformApi } from './tauriPlatformApi'

export function getPlatformApi(
  storageType: StorageType,
  vaultPath: string,
  assetsFolder: string,
): PlatformApi | null {
  switch (storageType) {
    case 'filesystem':
      return createTauriPlatformApi(vaultPath, assetsFolder)
    case 'database':
      return null
    default:
      throw new Error(`Unsupported storage type: ${storageType as string}`)
  }
}
