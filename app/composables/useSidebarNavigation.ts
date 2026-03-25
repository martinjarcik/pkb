import { computed } from 'vue'
import { loadConfig } from '~/config/loader'
import { isVaultRootNote } from '~/notes/noteFilters'

export type SidebarNavigationId = 'inbox'

const defaultTheme = loadConfig().theme

export function useSidebarNavigation() {
  const { listItems } = useNotes()
  const selectedId = useState<SidebarNavigationId>(
    'sidebarNavigation.selectedId',
    () => 'inbox',
  )
  const accentColor = computed(() => defaultTheme.accentColor)
  const visibleListItems = computed(() =>
    selectedId.value === 'inbox'
      ? listItems.value.filter((item) => isVaultRootNote(item.id))
      : listItems.value,
  )

  return {
    selectedId,
    accentColor,
    visibleListItems,
  }
}
