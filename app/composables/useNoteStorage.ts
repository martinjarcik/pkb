import { computed } from 'vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { createStorageContext } from '~/storage/context'

/** Lazily derives the current platform and note storage adapters from app config. */
export function useNoteStorage() {
  const { data: appConfigDisk } = useAppConfigDisk()
  const storageContext = computed(() =>
    createStorageContext({
      storageType: appConfigDisk.value.storageType,
      vault: appConfigDisk.value.vault,
      assetsFolder: appConfigDisk.value.editor.assetsFolder,
    }),
  )

  return {
    platformApi: computed(() => storageContext.value.platformApi),
    storage: computed(() => storageContext.value.storage),
  }
}
