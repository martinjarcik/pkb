import { computed, ref } from 'vue'
import { loadConfig } from '~/config/loader'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useFolderMeta } from '~/composables/useFolderMeta'
import { useNotes } from '~/composables/useNotes'
import { useNoteStorage } from '~/composables/useNoteStorage'
import { t } from '~/composables/useTranslations'
import { filterOrderedCatalogRowsByIds, searchNotes } from '~/notes/noteSearch'
import { sanitizeNoteTitleForFilename } from '~/notes/noteId'
import {
  allTagsFromCatalog,
  applyTagCycle,
  mergeTopLevelFolders,
  orderedCatalogRowsForSidebarView,
  selectedTagsFromView,
  tagFilterState as resolveTagFilterState,
  type SidebarNonSearchView,
  type TagFilterState,
  type SidebarWorkspaceView,
  vaultTopLevelFolderNames,
} from '~/notes/sidebarFilters'
import type { NoteCatalogRow } from '~/notes/types'

const defaultTheme = loadConfig().theme
const selectedView = ref<SidebarWorkspaceView>({ kind: 'inbox' })
const searchInput = ref('')
const searchRequestId = ref(0)
const foldersExpanded = ref(true)
const tagsExpanded = ref(true)
const explicitFolders = ref<string[]>([])

export function useSidebarNavigation() {
  const { catalog, allNotes, selectedNoteId, selectNoteById } = useNotes()
  const { storage } = useNoteStorage()
  const { meta } = useFolderMeta()
  const { data: appConfigDisk } = useAppConfigDisk()
  const accentColor = computed(() => defaultTheme.accentColor)
  const catalogDerivedFolders = computed(() =>
    vaultTopLevelFolderNames(catalog.value.map((row) => row.id)),
  )
  const metaDerivedFolders = computed(() =>
    Object.keys(meta.value.folders).sort((left, right) =>
      left.localeCompare(right),
    ),
  )
  const topLevelFolders = computed(() => {
    const merged = mergeTopLevelFolders(
      mergeTopLevelFolders(
        catalogDerivedFolders.value,
        metaDerivedFolders.value,
      ),
      explicitFolders.value,
    )
    const excluded =
      appConfigDisk.value?.editor.assetsFolder ??
      loadConfig().editor.assetsFolder

    return merged.filter((name) => name !== excluded)
  })
  const allTags = computed(() => allTagsFromCatalog(catalog.value))
  const selectedTags = computed(() => selectedTagsFromView(selectedView.value))
  const tagFilterState = (tag: string): TagFilterState =>
    resolveTagFilterState(selectedView.value, tag)

  const visibleCatalogRows = computed(() =>
    resolveVisibleCatalogRows(catalog.value, selectedView.value),
  )

  function resolveVisibleCatalogRows(
    rows: readonly NoteCatalogRow[],
    view: SidebarWorkspaceView,
  ): NoteCatalogRow[] {
    if (view.kind === 'search') {
      return filterOrderedCatalogRowsByIds(rows, view.matchingIds)
    }

    return orderedCatalogRowsForSidebarView(rows, view)
  }

  function clearSearchState(): void {
    searchInput.value = ''
    searchRequestId.value += 1
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
    await syncSelection(resolveVisibleCatalogRows(catalog.value, view))
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
      searchRequestId.value += 1

      if (selectedView.value.kind === 'search') {
        selectedView.value = selectedView.value.previousView
        await syncSelection(
          resolveVisibleCatalogRows(catalog.value, selectedView.value),
        )
      }

      return
    }

    const previousView =
      selectedView.value.kind === 'search'
        ? selectedView.value.previousView
        : selectedView.value

    searchRequestId.value += 1

    const matchingIds = searchNotes(allNotes.value, query)

    selectedView.value = {
      kind: 'search',
      query,
      matchingIds,
      previousView,
    }

    await syncSelection(
      resolveVisibleCatalogRows(catalog.value, selectedView.value),
    )
  }

  async function loadFolders(): Promise<void> {
    try {
      const folders = await storage.value.loadExplicitFolders()

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

  type FolderResult =
    | { ok: true; folderName: string }
    | { ok: false; error: string }

  async function createFolder(name: string): Promise<FolderResult> {
    const sanitized = sanitizeNoteTitleForFilename(name)

    if (sanitized.length === 0) {
      return { ok: false, error: t('sidebarFolders.errorEmpty') }
    }

    if (topLevelFolders.value.includes(sanitized)) {
      return { ok: false, error: t('sidebarFolders.errorDuplicate') }
    }

    try {
      await storage.value.createFolder(sanitized)

      explicitFolders.value = [...explicitFolders.value, sanitized]

      return { ok: true, folderName: sanitized }
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

    if (topLevelFolders.value.includes(sanitized)) {
      return { ok: false, error: t('sidebarFolders.errorDuplicate') }
    }

    try {
      await storage.value.renameFolder(oldName, sanitized)

      explicitFolders.value = explicitFolders.value.map((f) =>
        f === oldName ? sanitized : f,
      )

      if (
        selectedView.value.kind === 'folder' &&
        selectedView.value.folderName === oldName
      ) {
        selectedView.value = { kind: 'folder', folderName: sanitized }
      }

      return { ok: true, folderName: sanitized }
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
    updateSearchInput,
    loadFolders,
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
