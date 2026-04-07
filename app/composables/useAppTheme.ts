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
    sidebarBadge: computed(() => appConfigDisk.value.theme.sidebarBadge),
    applicationTypeface: computed(
      () => appConfigDisk.value.theme.typography.application.typeface,
    ),
    applicationFontSize: computed(
      () => appConfigDisk.value.theme.typography.application.fontSize,
    ),
    editorTypeface: computed(
      () => appConfigDisk.value.theme.typography.editor.typeface,
    ),
    editorFontSize: computed(
      () => appConfigDisk.value.theme.typography.editor.fontSize,
    ),
  }
}
