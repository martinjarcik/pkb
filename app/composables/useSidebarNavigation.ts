import { computed, reactive, ref } from 'vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useAppTheme } from '~/composables/useAppTheme'
import { useNoteCatalog } from '~/composables/useNoteCatalog'
import { useNoteSelection } from '~/composables/useNoteSelection'
import { useNoteStorage } from '~/composables/useNoteStorage'
import { t } from '~/composables/useTranslations'
import { filterOrderedCatalogRowsByIds, searchNotes } from '~/notes/noteSearch'
import { sanitizeNoteTitleForFilename } from '~/notes/noteId'
import {
  buildFolderTree,
  parentFolderPath,
  type FolderTreeNode,
} from '~/notes/folderTree'
import {
  allTagsFromCatalog,
  filterNotesWithTasks,
  mergeTopLevelFolders,
  orderedCatalogRowsForSidebarView,
  sortCatalogRowsPinnedFirstByModifiedAt,
} from '~/notes/sidebarViewFilters'
import {
  activeTagsFromView,
  applyTagCycle,
  tagFilterState as resolveTagFilterState,
} from '~/notes/tagFilterMachine'

import type {
  SidebarNonSearchView,
  SidebarWorkspaceView,
  TagFilterState,
} from '~/notes/sidebarViewTypes'
import type { Note, NoteCatalogRow } from '~/notes/types'

const selectedView = ref<SidebarWorkspaceView>({ kind: 'inbox' })
const searchInput = ref('')
const foldersExpanded = ref(true)
const tagsExpanded = ref(true)
const vaultFolders = ref<string[]>([])
const explicitFolders = ref<string[]>([])
const expandedFolderPaths = reactive(new Set<string>())

type FolderResult =
  | { ok: true; folderPath: string }
  | { ok: false; error: string }

function resolveVisibleCatalogRows(
  rows: readonly NoteCatalogRow[],
  view: SidebarWorkspaceView,
  notes: readonly Note[],
): NoteCatalogRow[] {
  if (view.kind === 'search') {
    return filterOrderedCatalogRowsByIds(rows, view.matchingIds)
  }

  if (view.kind === 'tasks') {
    return sortCatalogRowsPinnedFirstByModifiedAt(filterNotesWithTasks(notes))
  }

  return orderedCatalogRowsForSidebarView(rows, view)
}

function isExcludedFolderPath(folderPath: string, excluded: string): boolean {
  return folderPath === excluded || folderPath.startsWith(excluded + '/')
}

function siblingPaths(
  allPaths: readonly string[],
  parentPath: string,
): string[] {
  if (parentPath.length === 0) {
    return allPaths.filter((p) => !p.includes('/'))
  }

  const prefix = parentPath + '/'

  return allPaths
    .filter((p) => p.startsWith(prefix))
    .map((p) => p.slice(prefix.length))
    .filter((remainder) => !remainder.includes('/'))
}

function sanitizedFolderResult(
  siblingNames: readonly string[],
  name: string,
): FolderResult | { ok: true; folderPath: string } {
  const sanitized = sanitizeNoteTitleForFilename(name)

  if (sanitized.length === 0) {
    return { ok: false, error: t('sidebarFolders.errorEmpty') }
  }

  if (siblingNames.includes(sanitized)) {
    return { ok: false, error: t('sidebarFolders.errorDuplicate') }
  }

  return { ok: true, folderPath: sanitized }
}

function renameFolderPathValue(
  folderPath: string,
  oldPath: string,
  newPath: string,
): string {
  if (folderPath === oldPath) {
    return newPath
  }

  if (folderPath.startsWith(oldPath + '/')) {
    return newPath + folderPath.slice(oldPath.length)
  }

  return folderPath
}

function renameFolderPaths(
  folderPaths: readonly string[],
  oldPath: string,
  newPath: string,
): string[] {
  return [
    ...new Set(
      folderPaths.map((path) => renameFolderPathValue(path, oldPath, newPath)),
    ),
  ]
}

function renameFolderView(
  view: SidebarWorkspaceView,
  oldPath: string,
  newPath: string,
): SidebarWorkspaceView {
  if (view.kind === 'folder') {
    return {
      kind: 'folder',
      folderPath: renameFolderPathValue(view.folderPath, oldPath, newPath),
    }
  }

  if (view.kind !== 'search' || view.previousView.kind !== 'folder') {
    return view
  }

  return {
    ...view,
    previousView: {
      kind: 'folder',
      folderPath: renameFolderPathValue(
        view.previousView.folderPath,
        oldPath,
        newPath,
      ),
    },
  }
}

/** Owns the shared sidebar view, tag filters, and folder tree actions. */
export function useSidebarNavigation() {
  const { notes, allNotes, findNoteById } = useNoteCatalog()
  const selectionState = useNoteSelection()
  const { selectedNoteId } = selectionState
  const { storage } = useNoteStorage()
  const { data: appConfigDisk } = useAppConfigDisk()
  const { accentColor } = useAppTheme()
  const allFolderPaths = computed(() => {
    const merged = mergeTopLevelFolders(
      vaultFolders.value,
      explicitFolders.value,
    )
    const excluded =
      appConfigDisk.value.editor.assetsFolder.split('/')[0] ??
      appConfigDisk.value.editor.assetsFolder

    return merged.filter((p) => !isExcludedFolderPath(p, excluded))
  })
  const folderTree = computed<FolderTreeNode[]>(() =>
    buildFolderTree(allFolderPaths.value),
  )
  const allTags = computed(() => allTagsFromCatalog(notes.value))
  const selectedTags = computed(() => activeTagsFromView(selectedView.value))
  const tagFilterState = (tag: string): TagFilterState =>
    resolveTagFilterState(selectedView.value, tag)

  const visibleCatalogRows = computed(() =>
    resolveVisibleCatalogRows(notes.value, selectedView.value, allNotes.value),
  )

  function clearSearchState(): void {
    searchInput.value = ''
  }

  async function selectNoteById(id: string | null): Promise<void> {
    await selectionState.selectNoteById(id, notes.value, findNoteById)
  }

  async function syncSelection(rows: readonly NoteCatalogRow[]): Promise<void> {
    if (
      selectedNoteId.value &&
      rows.some((row) => row.id === selectedNoteId.value)
    ) {
      return
    }

    await selectNoteById(rows[0]?.id ?? null)
  }

  async function selectView(view: SidebarNonSearchView): Promise<void> {
    clearSearchState()
    selectedView.value = view
    await syncSelection(
      resolveVisibleCatalogRows(notes.value, view, allNotes.value),
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

  async function selectFolder(folderPath: string): Promise<void> {
    if (!allFolderPaths.value.includes(folderPath)) {
      return
    }

    await selectView({ kind: 'folder', folderPath })
  }

  function isFolderExpanded(folderPath: string): boolean {
    return expandedFolderPaths.has(folderPath)
  }

  function toggleFolderExpanded(folderPath: string): void {
    if (expandedFolderPaths.has(folderPath)) {
      expandedFolderPaths.delete(folderPath)
    } else {
      expandedFolderPaths.add(folderPath)
    }
  }

  function syncExpandedFolderPaths(oldPath: string, newPath: string): void {
    const nextPaths = [...expandedFolderPaths].map((path) =>
      renameFolderPathValue(path, oldPath, newPath),
    )

    expandedFolderPaths.clear()

    for (const path of nextPaths) {
      expandedFolderPaths.add(path)
    }
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

  async function updateSearchInput(nextValue: string): Promise<void> {
    searchInput.value = nextValue
    const query = nextValue.trim()

    if (query.length === 0) {
      if (selectedView.value.kind === 'search') {
        selectedView.value = selectedView.value.previousView
        await syncSelection(
          resolveVisibleCatalogRows(
            notes.value,
            selectedView.value,
            allNotes.value,
          ),
        )
      }

      return
    }

    const previousView =
      selectedView.value.kind === 'search'
        ? selectedView.value.previousView
        : selectedView.value

    const matchingIds = searchNotes(allNotes.value, query)

    selectedView.value = {
      kind: 'search',
      query,
      matchingIds,
      previousView,
    }

    await syncSelection(
      resolveVisibleCatalogRows(
        notes.value,
        selectedView.value,
        allNotes.value,
      ),
    )
  }

  async function loadVaultFolders(): Promise<void> {
    try {
      vaultFolders.value = await storage.value.loadFolderNames()
    } catch {
      vaultFolders.value = []
    }
  }

  function toggleFoldersExpanded(): void {
    foldersExpanded.value = !foldersExpanded.value
  }

  function toggleTagsExpanded(): void {
    tagsExpanded.value = !tagsExpanded.value
  }

  async function createFolder(
    name: string,
    parentPath: string = '',
  ): Promise<FolderResult> {
    const siblings = siblingPaths(allFolderPaths.value, parentPath)
    const folderResult = sanitizedFolderResult(siblings, name)

    if (!folderResult.ok) {
      return folderResult
    }

    const fullPath =
      parentPath.length > 0
        ? `${parentPath}/${folderResult.folderPath}`
        : folderResult.folderPath

    try {
      await storage.value.createFolder(fullPath)

      explicitFolders.value = [...explicitFolders.value, fullPath]

      if (parentPath.length > 0) {
        expandedFolderPaths.add(parentPath)
      }

      return { ok: true, folderPath: fullPath }
    } catch {
      return { ok: false, error: t('sidebarFolders.errorCreateFallback') }
    }
  }

  async function renameFolder(
    oldPath: string,
    newName: string,
  ): Promise<FolderResult> {
    const sanitized = sanitizeNoteTitleForFilename(newName)

    if (sanitized.length === 0) {
      return { ok: false, error: t('sidebarFolders.errorEmpty') }
    }

    const oldName =
      oldPath.lastIndexOf('/') === -1
        ? oldPath
        : oldPath.slice(oldPath.lastIndexOf('/') + 1)

    if (sanitized === oldName) {
      return { ok: true, folderPath: oldPath }
    }

    const parent = parentFolderPath(oldPath)
    const siblings = siblingPaths(
      allFolderPaths.value.filter(
        (p) => p !== oldPath && !p.startsWith(oldPath + '/'),
      ),
      parent,
    )
    const folderResult = sanitizedFolderResult(siblings, sanitized)

    if (!folderResult.ok) {
      return folderResult
    }

    const newPath =
      parent.length > 0
        ? `${parent}/${folderResult.folderPath}`
        : folderResult.folderPath

    try {
      await storage.value.renameFolder(oldPath, newPath)

      vaultFolders.value = renameFolderPaths(
        vaultFolders.value,
        oldPath,
        newPath,
      )
      explicitFolders.value = renameFolderPaths(
        explicitFolders.value,
        oldPath,
        newPath,
      )
      syncExpandedFolderPaths(oldPath, newPath)
      selectedView.value = renameFolderView(
        selectedView.value,
        oldPath,
        newPath,
      )

      return { ok: true, folderPath: newPath }
    } catch {
      return { ok: false, error: t('sidebarFolders.errorRenameFallback') }
    }
  }

  return {
    selectedView,
    searchInput,
    accentColor,
    allFolderPaths,
    folderTree,
    foldersExpanded,
    tagsExpanded,
    allTags,
    selectedTags,
    tagFilterState,
    visibleCatalogRows,
    loadVaultFolders,
    updateSearchInput,
    selectInbox,
    selectTasks,
    selectFavorites,
    selectTrashed,
    selectFolder,
    isFolderExpanded,
    toggleFolderExpanded,
    toggleFoldersExpanded,
    toggleTagsExpanded,
    createFolder,
    renameFolder,
    cycleTag,
  }
}

export type { TagFilterState }
