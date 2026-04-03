import { computed } from 'vue'
import { getNoteStorage } from '~/storage/router'
import { getPlatformApi } from '~/storage/platformRouter'

export function useNoteStorage() {
  const { data: appConfigDisk } = useAppConfigDisk()
  const platformApi = computed(() =>
    getPlatformApi(appConfigDisk.value.storageType),
  )

  const storage = computed(() =>
    getNoteStorage({
      storageType: appConfigDisk.value.storageType,
      platformApi: platformApi.value,
      vault: appConfigDisk.value.vault,
    }),
  )

  return {
    platformApi,
    storage,
  }
}
