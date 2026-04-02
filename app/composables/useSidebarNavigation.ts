import { computed } from 'vue'
import { loadConfig } from '~/config/loader'
import { t } from '~/composables/useTranslations'
import { sanitizeNoteTitleForFilename } from '~/notes/noteId'
import {
  allTagsFromCatalog,
  applyTagCycle,
  mergeTopLevelFolders,
  orderedCatalogRowsForSidebarView,
  selectedTagsFromView,
  type SidebarWorkspaceView,
  vaultTopLevelFolderNames,
} from '~/notes/sidebarFilters'

const defaultTheme = loadConfig().theme

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
  const { data: appConfigDisk } = useAppConfigDisk()
  const accentColor = computed(() => defaultTheme.accentColor)
  const catalogDerivedFolders = computed(() =>
    vaultTopLevelFolderNames(catalog.value.map((row) => row.id)),
  )
  const topLevelFolders = computed(() => {
    const merged = mergeTopLevelFolders(
      catalogDerivedFolders.value,
      explicitFolders.value,
    )
    const excluded =
      appConfigDisk.value?.editor.assetsFolder ??
      loadConfig().editor.assetsFolder

    return merged.filter((name) => name !== excluded)
  })
  const allTags = computed(() => allTagsFromCatalog(catalog.value))
  const selectedTags = computed(() => selectedTagsFromView(selectedView.value))

  const visibleCatalogRows = computed(() =>
    orderedCatalogRowsForSidebarView(catalog.value, selectedView.value),
  )

  async function selectView(view: SidebarWorkspaceView): Promise<void> {
    selectedView.value = view
    await selectNoteById(
      orderedCatalogRowsForSidebarView(catalog.value, view)[0]?.id ?? null,
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
      await globalThis.$fetch('/api/folders', {
        method: 'POST',
        body: { name: sanitized },
      })

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
      await globalThis.$fetch('/api/folders', {
        method: 'PATCH',
        body: { oldName, newName: sanitized },
      })

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
    renameFolder,
    cycleTag,
  }
}
