import { useState } from '#app'
import {
  readAppConfigPersistence,
  writeAppConfigPatchPersistence,
} from '~/config/persistence'
import { getPlatformApi } from '~/storage/platformRouter'
import { loadConfig, type AppConfig } from '~/config/loader'

export function useAppConfigDisk() {
  const data = useState<AppConfig>('app-config-disk', () => loadConfig())

  async function loadAppConfigDisk(): Promise<void> {
    try {
      const storageType = data.value.storageType

      data.value = await readAppConfigPersistence(
        storageType,
        getPlatformApi(storageType),
      )
    } catch {
      data.value = loadConfig()
    }
  }

  async function saveAppConfigPatch(
    patch: Record<string, unknown>,
  ): Promise<AppConfig> {
    const updated = await writeAppConfigPatchPersistence(
      data.value.storageType,
      getPlatformApi(data.value.storageType),
      patch,
    )

    data.value = updated

    return updated
  }

  return {
    data,
    loadAppConfigDisk,
    saveAppConfigPatch,
  }
}
