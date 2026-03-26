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
  | { kind: 'tags'; selectedTags: string[] }

const defaultTheme = loadConfig().theme

function rowTags(row: NoteCatalogRow): string[] {
  if (!Array.isArray(row.tags)) {
    return []
  }

  return row.tags.filter((tag): tag is string => typeof tag === 'string')
}

export function allTagsFromCatalog(rows: readonly NoteCatalogRow[]): string[] {
  return [...new Set(rows.flatMap((row) => rowTags(row)))].sort((left, right) =>
    left.localeCompare(right),
  )
}

export function filterCatalogBySelectedTags(
  rows: readonly NoteCatalogRow[],
  selectedTags: readonly string[],
): readonly NoteCatalogRow[] {
  if (selectedTags.length === 0) {
    return rows
  }

  return rows.filter((row) => {
    const tags = rowTags(row)

    return selectedTags.every((tag) => tags.includes(tag))
  })
}

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
  const allTags = computed(() => allTagsFromCatalog(catalog.value))
  const selectedTags = computed(() =>
    selectedView.value.kind === 'tags' ? selectedView.value.selectedTags : [],
  )

  function filterCatalog(
    view: SidebarWorkspaceView,
  ): readonly NoteCatalogRow[] {
    if (view.kind === 'inbox') {
      return catalog.value.filter((row) => isVaultRootNote(row.id))
    }

    if (view.kind === 'tags') {
      return filterCatalogBySelectedTags(catalog.value, view.selectedTags)
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

  async function toggleTag(tag: string): Promise<void> {
    if (!allTags.value.includes(tag)) {
      return
    }

    const nextSelectedTags = selectedTags.value.includes(tag)
      ? selectedTags.value.filter((selectedTag) => selectedTag !== tag)
      : [...selectedTags.value, tag].sort((left, right) =>
          left.localeCompare(right),
        )

    if (nextSelectedTags.length === 0) {
      await selectInbox()
      return
    }

    await selectView({ kind: 'tags', selectedTags: nextSelectedTags })
  }

  return {
    selectedView,
    accentColor,
    topLevelFolders,
    allTags,
    selectedTags,
    visibleCatalogRows,
    selectInbox,
    selectFolder,
    toggleTag,
  }
}
