import { computed } from 'vue'
import { loadConfig } from '~/config/loader'
import {
  isDirectChildOfVaultFolder,
  isVaultRootNote,
  vaultTopLevelFolderNames,
} from '~/notes/noteFilters'

export type SidebarWorkspaceView =
  | { kind: 'inbox' }
  | { kind: 'folder'; folderName: string }

const defaultTheme = loadConfig().theme

export function useSidebarNavigation() {
  const { listItems, selectNoteById } = useNotes()
  const selectedView = useState<SidebarWorkspaceView>(
    'sidebarNavigation.selectedView',
    () => ({ kind: 'inbox' }),
  )
  const accentColor = computed(() => defaultTheme.accentColor)
  const topLevelFolders = computed(() =>
    vaultTopLevelFolderNames(listItems.value.map((item) => item.id)),
  )

  function filterListItems(view: SidebarWorkspaceView) {
    if (view.kind === 'inbox') {
      return listItems.value.filter((item) => isVaultRootNote(item.id))
    }

    return listItems.value.filter((item) =>
      isDirectChildOfVaultFolder(item.id, view.folderName),
    )
  }

  const visibleListItems = computed(() => filterListItems(selectedView.value))

  async function selectView(view: SidebarWorkspaceView): Promise<void> {
    selectedView.value = view
    await selectNoteById(filterListItems(view)[0]?.id ?? null)
  }

  async function selectInbox(): Promise<void> {
    await selectView({ kind: 'inbox' })
  }

  async function selectFolder(folderName: string): Promise<void> {
    if (!topLevelFolders.value.includes(folderName)) {
      return
    }

    await selectView({ kind: 'folder', folderName })
  }

  return {
    selectedView,
    accentColor,
    topLevelFolders,
    visibleListItems,
    selectInbox,
    selectFolder,
  }
}
