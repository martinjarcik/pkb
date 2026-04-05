import { ref } from 'vue'
import {
  readAppConfigPersistence,
  writeAppConfigPatchPersistence,
} from '~/config/persistence'
import { loadConfig } from '~/config/loader'
import type { AppConfig } from '~/config/parseAppConfig'
import { getPlatformApi } from '~/storage/platformRouter'

const data = ref<AppConfig>(loadConfig())

export function useAppConfigDisk() {
  async function loadAppConfigDisk(): Promise<void> {
    try {
      const storageType = data.value.storageType

      data.value = await readAppConfigPersistence(
        getPlatformApi(
          storageType,
          data.value.vault,
          data.value.editor.assetsFolder,
        ),
      )
    } catch {
      data.value = loadConfig()
    }
  }

  async function saveAppConfigPatch(
    patch: Record<string, unknown>,
  ): Promise<AppConfig> {
    const updated = await writeAppConfigPatchPersistence(
      getPlatformApi(
        data.value.storageType,
        data.value.vault,
        data.value.editor.assetsFolder,
      ),
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
