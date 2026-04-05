import { computed, ref } from 'vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useAppTheme } from '~/composables/useAppTheme'
import { useNoteCatalog } from '~/composables/useNoteCatalog'
import { useNoteSelection } from '~/composables/useNoteSelection'
import { useNoteStorage } from '~/composables/useNoteStorage'
import { t } from '~/composables/useTranslations'
import { filterOrderedCatalogRowsByIds, searchNotes } from '~/notes/noteSearch'
import { sanitizeNoteTitleForFilename } from '~/notes/noteId'
import {
  allTagsFromCatalog,
  mergeTopLevelFolders,
  orderedCatalogRowsForSidebarView,
} from '~/notes/sidebarViewFilters'
import {
  applyTagCycle,
  selectedTagsFromView,
  tagFilterState as resolveTagFilterState,
} from '~/notes/tagFilterMachine'

import type {
  SidebarNonSearchView,
  SidebarWorkspaceView,
  TagFilterState,
} from '~/notes/sidebarViewTypes'
import type { NoteCatalogRow } from '~/notes/types'

const selectedView = ref<SidebarWorkspaceView>({ kind: 'inbox' })
const searchInput = ref('')
const foldersExpanded = ref(true)
const tagsExpanded = ref(true)
const vaultFolders = ref<string[]>([])
const explicitFolders = ref<string[]>([])

type FolderResult =
  | { ok: true; folderName: string }
  | { ok: false; error: string }

function resolveVisibleCatalogRows(
  rows: readonly NoteCatalogRow[],
  view: SidebarWorkspaceView,
): NoteCatalogRow[] {
  if (view.kind === 'search') {
    return filterOrderedCatalogRowsByIds(rows, view.matchingIds)
  }

  return orderedCatalogRowsForSidebarView(rows, view)
}

function sanitizedFolderResult(
  currentFolders: readonly string[],
  name: string,
): FolderResult | { ok: true; folderName: string; unchanged?: boolean } {
  const sanitized = sanitizeNoteTitleForFilename(name)

  if (sanitized.length === 0) {
    return { ok: false, error: t('sidebarFolders.errorEmpty') }
  }

  if (currentFolders.includes(sanitized)) {
    return { ok: false, error: t('sidebarFolders.errorDuplicate') }
  }

  return { ok: true, folderName: sanitized }
}

/** Owns the shared sidebar view, tag filters, and top-level folder actions. */
export function useSidebarNavigation() {
  const { notes, allNotes, findNoteById } = useNoteCatalog()
  const selectionState = useNoteSelection()
  const { selectedNoteId } = selectionState
  const { storage } = useNoteStorage()
  const { data: appConfigDisk } = useAppConfigDisk()
  const { accentColor } = useAppTheme()
  const topLevelFolders = computed(() => {
    const merged = mergeTopLevelFolders(
      vaultFolders.value,
      explicitFolders.value,
    )
    const excluded =
      appConfigDisk.value.editor.assetsFolder.split('/')[0] ??
      appConfigDisk.value.editor.assetsFolder

    return merged.filter((name) => name !== excluded)
  })
  const allTags = computed(() => allTagsFromCatalog(notes.value))
  const selectedTags = computed(() => selectedTagsFromView(selectedView.value))
  const tagFilterState = (tag: string): TagFilterState =>
    resolveTagFilterState(selectedView.value, tag)

  const visibleCatalogRows = computed(() =>
    resolveVisibleCatalogRows(notes.value, selectedView.value),
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
    await syncSelection(resolveVisibleCatalogRows(notes.value, view))
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

  async function updateSearchInput(nextValue: string): Promise<void> {
    searchInput.value = nextValue
    const query = nextValue.trim()

    if (query.length === 0) {
      if (selectedView.value.kind === 'search') {
        selectedView.value = selectedView.value.previousView
        await syncSelection(
          resolveVisibleCatalogRows(notes.value, selectedView.value),
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
      resolveVisibleCatalogRows(notes.value, selectedView.value),
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

  async function createFolder(name: string): Promise<FolderResult> {
    const folderResult = sanitizedFolderResult(topLevelFolders.value, name)

    if (!folderResult.ok) {
      return folderResult
    }

    try {
      await storage.value.createFolder(folderResult.folderName)

      explicitFolders.value = [
        ...explicitFolders.value,
        folderResult.folderName,
      ]

      return folderResult
    } catch {
      return { ok: false, error: t('sidebarFolders.errorCreateFallback') }
    }
  }

  async function renameFolder(
    oldName: string,
    newName: string,
  ): Promise<FolderResult> {
    const sanitized = sanitizeNoteTitleForFilename(newName)

    if (sanitized.length === 0) {
      return { ok: false, error: t('sidebarFolders.errorEmpty') }
    }

    if (sanitized === oldName) {
      return { ok: true, folderName: oldName }
    }

    const folderResult = sanitizedFolderResult(
      topLevelFolders.value.filter((folderName) => folderName !== oldName),
      sanitized,
    )

    if (!folderResult.ok) {
      return folderResult
    }

    try {
      await storage.value.renameFolder(oldName, folderResult.folderName)

      explicitFolders.value = explicitFolders.value.map((f) =>
        f === oldName ? folderResult.folderName : f,
      )

      if (
        selectedView.value.kind === 'folder' &&
        selectedView.value.folderName === oldName
      ) {
        selectedView.value = {
          kind: 'folder',
          folderName: folderResult.folderName,
        }
      }

      return folderResult
    } catch {
      return { ok: false, error: t('sidebarFolders.errorRenameFallback') }
    }
  }

  return {
    selectedView,
    searchInput,
    accentColor,
    topLevelFolders,
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
    toggleFoldersExpanded,
    toggleTagsExpanded,
    createFolder,
    renameFolder,
    cycleTag,
  }
}

export type { TagFilterState }
