import { computed } from 'vue'
import { getNoteStorage } from '~/storage/router'
import { getPlatformApi } from '~/storage/platformRouter'

export function useNoteStorage() {
  const { data: appConfigDisk } = useAppConfigDisk()
  const platformApi = computed(() =>
    getPlatformApi(appConfigDisk.value.applicationType),
  )

  const storage = computed(() =>
    getNoteStorage({
      applicationType: appConfigDisk.value.applicationType,
      platformApi: platformApi.value,
      vault: appConfigDisk.value.vault,
    }),
  )

  return {
    platformApi,
    storage,
  }
}
