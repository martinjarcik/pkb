import { computed } from 'vue'
import { loadConfig } from '~/config/loader'
import type { NoteCatalogRow } from '~/notes/types'
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
  const { catalog, selectNoteById } = useNotes()
  const selectedView = useState<SidebarWorkspaceView>(
    'sidebarNavigation.selectedView',
    () => ({ kind: 'inbox' }),
  )
  const accentColor = computed(() => defaultTheme.accentColor)
  const topLevelFolders = computed(() =>
    vaultTopLevelFolderNames(catalog.value.map((row) => row.id)),
  )

  function filterCatalog(
    view: SidebarWorkspaceView,
  ): readonly NoteCatalogRow[] {
    if (view.kind === 'inbox') {
      return catalog.value.filter((row) => isVaultRootNote(row.id))
    }

    return catalog.value.filter((row) =>
      isDirectChildOfVaultFolder(row.id, view.folderName),
    )
  }

  const visibleCatalogRows = computed(() => filterCatalog(selectedView.value))

  async function selectView(view: SidebarWorkspaceView): Promise<void> {
    selectedView.value = view
    await selectNoteById(filterCatalog(view)[0]?.id ?? null)
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
    visibleCatalogRows,
    selectInbox,
    selectFolder,
  }
}
