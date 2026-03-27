import { computed } from 'vue'
import { loadConfig } from '~/config/loader'
import { t } from '~/composables/useTranslations'
import type { NoteCatalogRow } from '~/notes/types'
import { sanitizeNoteTitleForFilename } from '~/notes/renameNoteTitle'
import {
  isDirectChildOfVaultFolder,
  isVaultRootNote,
  vaultTopLevelFolderNames,
} from '~/notes/noteFilters'
import { catalogRowIsTrashed } from '~/notes/trash'

export type TagFilterState = 'idle' | 'active' | 'pinned'

export type SidebarWorkspaceView =
  | { kind: 'inbox' }
  | { kind: 'tasks' }
  | { kind: 'favorites' }
  | { kind: 'trashed' }
  | { kind: 'folder'; folderName: string }
  | { kind: 'tags'; activeTags: string[]; pinnedTags: string[] }

const defaultTheme = loadConfig().theme

function rowTags(row: NoteCatalogRow): string[] {
  if (!Array.isArray(row.tags)) {
    return []
  }

  return row.tags.filter((tag): tag is string => typeof tag === 'string')
}

function rowHasTasks(row: NoteCatalogRow): boolean {
  return row.hasTasks === true
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

export function filterCatalogByHasTasks(
  rows: readonly NoteCatalogRow[],
): readonly NoteCatalogRow[] {
  return rows.filter((row) => rowHasTasks(row))
}

export function tagFilterState(
  view: SidebarWorkspaceView,
  tag: string,
): TagFilterState {
  if (view.kind !== 'tags') {
    return 'idle'
  }

  if (view.pinnedTags.includes(tag)) {
    return 'pinned'
  }

  if (view.activeTags.includes(tag)) {
    return 'active'
  }

  return 'idle'
}

export function cycleTagState(state: TagFilterState): TagFilterState {
  if (state === 'idle') {
    return 'active'
  }

  if (state === 'active') {
    return 'pinned'
  }

  return 'idle'
}

export function selectedTagsFromView(view: SidebarWorkspaceView): string[] {
  if (view.kind !== 'tags') {
    return []
  }

  return [...view.activeTags, ...view.pinnedTags].sort((left, right) =>
    left.localeCompare(right),
  )
}

export function applyTagCycle(
  view: SidebarWorkspaceView,
  tag: string,
): SidebarWorkspaceView | null {
  const current = tagFilterState(view, tag)
  const next = cycleTagState(current)
  const pinned =
    view.kind === 'tags' ? view.pinnedTags.filter((t) => t !== tag) : []

  if (next === 'active') {
    const nextView: SidebarWorkspaceView = {
      kind: 'tags',
      activeTags: [tag],
      pinnedTags: pinned,
    }

    return nextView
  }

  if (next === 'pinned') {
    const active =
      view.kind === 'tags' ? view.activeTags.filter((t) => t !== tag) : []
    const nextView: SidebarWorkspaceView = {
      kind: 'tags',
      activeTags: active,
      pinnedTags: [...pinned, tag].sort((left, right) =>
        left.localeCompare(right),
      ),
    }

    return nextView
  }

  const active =
    view.kind === 'tags' ? view.activeTags.filter((t) => t !== tag) : []

  if (pinned.length === 0 && active.length === 0) {
    return null
  }

  return { kind: 'tags', activeTags: active, pinnedTags: pinned }
}

export function mergeTopLevelFolders(
  catalogDerived: string[],
  explicit: string[],
): string[] {
  return [...new Set([...catalogDerived, ...explicit])].sort((left, right) =>
    left.localeCompare(right),
  )
}

export function filterCatalogForSidebarView(
  rows: readonly NoteCatalogRow[],
  view: SidebarWorkspaceView,
): readonly NoteCatalogRow[] {
  if (view.kind === 'inbox') {
    return rows.filter(
      (row) => isVaultRootNote(row.id) && !catalogRowIsTrashed(row),
    )
  }

  if (view.kind === 'tags') {
    return filterCatalogBySelectedTags(
      rows.filter((row) => !catalogRowIsTrashed(row)),
      selectedTagsFromView(view),
    )
  }

  if (view.kind === 'tasks') {
    return filterCatalogByHasTasks(
      rows.filter((row) => !catalogRowIsTrashed(row)),
    )
  }

  if (view.kind === 'favorites') {
    return rows.filter(
      (row) => row.favorite === true && !catalogRowIsTrashed(row),
    )
  }

  if (view.kind === 'trashed') {
    return rows.filter((row) => catalogRowIsTrashed(row))
  }

  return rows.filter(
    (row) =>
      isDirectChildOfVaultFolder(row.id, view.folderName) &&
      !catalogRowIsTrashed(row),
  )
}

export function useSidebarNavigation() {
  const { catalog, selectNoteById } = useNotes()
  const selectedView = useState<SidebarWorkspaceView>(
    'sidebarNavigation.selectedView',
    () => ({ kind: 'inbox' }),
  )
  const foldersExpanded = useState(
    'sidebarNavigation.foldersExpanded',
    () => true,
  )
  const tagsExpanded = useState('sidebarNavigation.tagsExpanded', () => true)
  const explicitFolders = useState<string[]>(
    'sidebarNavigation.explicitFolders',
    () => [],
  )
  const accentColor = computed(() => defaultTheme.accentColor)
  const catalogDerivedFolders = computed(() =>
    vaultTopLevelFolderNames(catalog.value.map((row) => row.id)),
  )
  const topLevelFolders = computed(() =>
    mergeTopLevelFolders(catalogDerivedFolders.value, explicitFolders.value),
  )
  const allTags = computed(() => allTagsFromCatalog(catalog.value))
  const selectedTags = computed(() => selectedTagsFromView(selectedView.value))

  const visibleCatalogRows = computed(() =>
    filterCatalogForSidebarView(catalog.value, selectedView.value),
  )

  async function selectView(view: SidebarWorkspaceView): Promise<void> {
    selectedView.value = view
    await selectNoteById(
      filterCatalogForSidebarView(catalog.value, view)[0]?.id ?? null,
    )
  }

  async function selectInbox(): Promise<void> {
    await selectView({ kind: 'inbox' })
  }

  async function selectTasks(): Promise<void> {
    await selectView({ kind: 'tasks' })
  }

  async function selectFavorites(): Promise<void> {
    await selectView({ kind: 'favorites' })
  }

  async function selectTrashed(): Promise<void> {
    await selectView({ kind: 'trashed' })
  }

  async function selectFolder(folderName: string): Promise<void> {
    if (!topLevelFolders.value.includes(folderName)) {
      return
    }

    await selectView({ kind: 'folder', folderName })
  }

  async function cycleTag(tag: string): Promise<void> {
    if (!allTags.value.includes(tag)) {
      return
    }

    const nextView = applyTagCycle(selectedView.value, tag)

    if (!nextView) {
      await selectInbox()
      return
    }

    await selectView(nextView)
  }

  async function loadFolders(): Promise<void> {
    try {
      const folders = await globalThis.$fetch<string[]>('/api/folders')

      explicitFolders.value = folders
    } catch {
      // Non-critical; catalog-derived folders still work.
    }
  }

  function toggleFoldersExpanded(): void {
    foldersExpanded.value = !foldersExpanded.value
  }

  function toggleTagsExpanded(): void {
    tagsExpanded.value = !tagsExpanded.value
  }

  async function createFolder(name: string): Promise<string | null> {
    const sanitized = sanitizeNoteTitleForFilename(name)

    if (sanitized.length === 0) {
      return t('sidebarFolders.errorEmpty')
    }

    if (topLevelFolders.value.includes(sanitized)) {
      return t('sidebarFolders.errorDuplicate')
    }

    try {
      await globalThis.$fetch('/api/folders', {
        method: 'POST',
        body: { name: sanitized },
      })

      explicitFolders.value = [...explicitFolders.value, sanitized]

      return null
    } catch {
      return t('sidebarFolders.errorCreateFallback')
    }
  }

  return {
    selectedView,
    accentColor,
    topLevelFolders,
    foldersExpanded,
    tagsExpanded,
    allTags,
    selectedTags,
    visibleCatalogRows,
    loadFolders,
    selectInbox,
    selectTasks,
    selectFavorites,
    selectTrashed,
    selectFolder,
    toggleFoldersExpanded,
    toggleTagsExpanded,
    createFolder,
    cycleTag,
  }
}
