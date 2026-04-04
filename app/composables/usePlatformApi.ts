import { computed } from 'vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { getPlatformApi } from '~/storage/platformRouter'

export function usePlatformApi() {
  const { data: appConfigDisk } = useAppConfigDisk()
  const platformApi = computed(() =>
    getPlatformApi(
      appConfigDisk.value.storageType,
      appConfigDisk.value.vault,
      appConfigDisk.value.editor.assetsFolder,
    ),
  )

  return {
    platformApi,
  }
}
