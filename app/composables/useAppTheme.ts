import { computed } from 'vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'

/** Exposes the current app-wide theme tokens derived from persisted config. */
export function useAppTheme() {
  const { data: appConfigDisk } = useAppConfigDisk()

  return {
    accentColor: computed(() => appConfigDisk.value.theme.accentColor),
    sidebarBackgroundColor: computed(
      () => appConfigDisk.value.theme.sidebarBackgroundColor,
    ),
    sidebarTextColor: computed(
      () => appConfigDisk.value.theme.sidebarTextColor,
    ),
  }
}
