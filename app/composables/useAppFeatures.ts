import { computed } from 'vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'

export function useAppFeatures() {
  const { data: appConfigDisk } = useAppConfigDisk()

  return {
    favorites: computed(() => appConfigDisk.value.features.favorites),
    tasks: computed(() => appConfigDisk.value.features.tasks),
    pinned: computed(() => appConfigDisk.value.features.pinned),
    nonDistractionMode: computed(
      () => appConfigDisk.value.features.nonDistractionMode,
    ),
    noteWebhook: computed(() => appConfigDisk.value.features.noteWebhook),
  }
}
