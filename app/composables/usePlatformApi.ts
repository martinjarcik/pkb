import { computed } from 'vue'
import { getPlatformApi } from '~/storage/platformRouter'

export function usePlatformApi() {
  const { data: appConfigDisk } = useAppConfigDisk()
  const platformApi = computed(() =>
    getPlatformApi(appConfigDisk.value.storageType),
  )

  return {
    platformApi,
  }
}
