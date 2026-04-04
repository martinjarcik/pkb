import { computed } from 'vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'

export function useAppTheme() {
  const { data: appConfigDisk } = useAppConfigDisk()

  return {
    accentColor: computed(() => appConfigDisk.value.theme.accentColor),
    defaultEditorColor: computed(
      () => appConfigDisk.value.theme.defaultEditorColor,
    ),
  }
}
