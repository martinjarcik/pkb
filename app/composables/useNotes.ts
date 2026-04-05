import { computed, ref } from 'vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useNoteCatalog } from '~/composables/useNoteCatalog'
import { useNoteMutations } from '~/composables/useNoteMutations'
import { useNoteSelection } from '~/composables/useNoteSelection'
import { useNoteStorage } from '~/composables/useNoteStorage'
import { t } from '~/composables/useTranslations'
import { catalogRowIsTrashed, trashExpired } from '~/notes/trash'
import type { NoteCatalogRow } from '~/notes/types'
const isRenamingNoteTitle = ref(false)
const saveError = ref<string | null>(null)

/** Composes the note catalog, selection, storage, and mutation APIs for the UI. */
export function useNotes() {
  const { data: appConfigDisk } = useAppConfigDisk()
  const editorAutosaveDelay = computed(
    () => appConfigDisk.value.editor.autosaveDelay,
  )
  const { storage } = useNoteStorage()
  const catalogState = useNoteCatalog()
  const selectionState = useNoteSelection()
  const {
    allNotes,
    notes,
    isLoading,
    loadError,
    setAllNotes,
    clearAllNotes,
    removeNotesByIds,
    findNoteById,
    replaceNote,
    replaceRenamedNote,
    prependNote,
  } = catalogState
  const {
    shouldFocusTitle,
    selectedNoteId,
    selectedNoteFull,
    registerEditorFlush,
    clearShouldFocusTitle,
  } = selectionState

  const selectedNote = selectedNoteFull
  const showNoteControls = computed(() => {
    return (
      selectedNote.value !== null && !catalogRowIsTrashed(selectedNote.value)
    )
  })
  const selectedNoteTitle = computed(() => {
    const currentSelectedNote = selectedNote.value

    if (currentSelectedNote) {
      return currentSelectedNote.title
    }

    if (selectedNoteId.value) {
      return (
        notes.value.find((note) => note.id === selectedNoteId.value)?.title ??
        ''
      )
    }

    return ''
  })

  async function selectNoteById(id: string | null): Promise<void> {
    await selectionState.selectNoteById(id, notes.value, findNoteById)
  }

  const noteMutationsArgs: Parameters<typeof useNoteMutations>[0] = {
    storage,
    catalogState: {
      notes,
      findNoteById,
      replaceNote,
      replaceRenamedNote,
      prependNote,
      updateNoteContent: (id, content) => {
        const nextNote = catalogState.updateNoteContent(id, content)

        if (nextNote && selectedNoteFull.value?.id === id) {
          selectedNoteFull.value = nextNote
        }

        return nextNote
      },
    },
    selectionState: {
      editorFlush: selectionState.editorFlush,
      selectedNote,
      selectedNoteId,
      selectedNoteFull,
      shouldFocusTitle,
      selectNoteById,
    },
    saveError,
    isRenamingNoteTitle,
  }

  const {
    saveSelectedNoteContent,
    createNote,
    renameSelectedNoteTitle,
    moveNote,
    toggleFavoriteSelectedNote,
    togglePinnedSelectedNote,
    toggleWideSelectedNote,
    saveWebhookForSelectedNote,
    deleteSelectedNote,
  } = useNoteMutations(noteMutationsArgs)

  async function purgeExpiredTrashedNotes(
    loadedRows: readonly NoteCatalogRow[],
  ): Promise<void> {
    const retentionDays = appConfigDisk.value.notes.trashRetentionDays
    const now = new Date()
    const expiredIds = loadedRows
      .filter(
        (note) =>
          catalogRowIsTrashed(note) &&
          typeof note.trashedAt === 'string' &&
          trashExpired(note.trashedAt, retentionDays, now),
      )
      .map((note) => note.id)

    if (expiredIds.length === 0) {
      return
    }

    const deletedIds: string[] = []
    const results = await Promise.allSettled(
      expiredIds.map(async (id) => {
        await storage.value.deleteNote(id)
        deletedIds.push(id)
      }),
    )

    if (results.some((result) => result.status === 'fulfilled')) {
      removeNotesByIds(deletedIds)
    }
  }

  async function loadNotes(): Promise<NoteCatalogRow[]> {
    isLoading.value = true
    loadError.value = null

    try {
      const loaded = await storage.value.loadAllNotes()
      setAllNotes(loaded)
      void purgeExpiredTrashedNotes(loaded)

      return notes.value
    } catch (error) {
      clearAllNotes()
      selectedNoteFull.value = null
      await selectNoteById(null)
      loadError.value =
        error instanceof Error ? error.message : t('notes.errorLoadFallback')

      return []
    } finally {
      isLoading.value = false
    }
  }

  return {
    editorAutosaveDelay,
    allNotes,
    notes,
    isLoading,
    isRenamingNoteTitle,
    loadError,
    saveError,
    shouldFocusTitle,
    selectedNoteId,
    selectedNote,
    showNoteControls,
    selectedNoteTitle,
    clearShouldFocusTitle,
    createNote,
    deleteSelectedNote,
    toggleFavoriteSelectedNote,
    togglePinnedSelectedNote,
    toggleWideSelectedNote,
    saveWebhookForSelectedNote,
    moveNote,
    registerEditorFlush,
    renameSelectedNoteTitle,
    saveSelectedNoteContent,
    selectNoteById,
    loadNotes,
  }
}
