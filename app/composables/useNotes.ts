import { computed, ref } from 'vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useNoteMutations } from '~/composables/useNoteMutations'
import { useNoteStorage } from '~/composables/useNoteStorage'
import { t } from '~/composables/useTranslations'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import { catalogRowIsTrashed, trashExpired } from '~/notes/trash'
import type { Note, NoteCatalogRow } from '~/notes/types'

type EditorFlush = () => Promise<void>

const allNotes = ref<Note[]>([])
const notes = ref<NoteCatalogRow[]>([])
const isLoading = ref(false)
const isRenamingNoteTitle = ref(false)
const loadError = ref<string | null>(null)
const saveError = ref<string | null>(null)
const editorFlush = ref<EditorFlush | null>(null)
const shouldFocusTitle = ref(false)
const selectedNoteId = ref<string | null>(null)
const selectedNoteFull = ref<Note | null>(null)
const selectedNoteRequestId = ref(0)

export function useNotes() {
  const { data: appConfigDisk } = useAppConfigDisk()
  const editorAutosaveDelay = computed(
    () => appConfigDisk.value.editor.autosaveDelay,
  )
  const { storage } = useNoteStorage()

  function rebuildCatalog(): void {
    notes.value = sortNotesByModifiedAt(allNotes.value)
  }

  function sortNotesByModifiedAt(
    nextNotes: NoteCatalogRow[],
  ): NoteCatalogRow[] {
    return nextNotes.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
  }

  function replaceInStore(matchId: string, replacement: Note): void {
    allNotes.value = allNotes.value.map((note) =>
      note.id === matchId ? replacement : note,
    )
    rebuildCatalog()
  }

  function replaceNoteInStore(nextNote: Note): void {
    replaceInStore(nextNote.id, nextNote)
  }

  function replaceRenamedNoteInStore(previousId: string, nextNote: Note): void {
    replaceInStore(previousId, nextNote)
  }

  function prependNoteToStore(nextNote: Note): void {
    allNotes.value = [
      nextNote,
      ...allNotes.value.filter((note) => note.id !== nextNote.id),
    ]
    rebuildCatalog()
  }

  function updateSelectedNoteContent(content: string): void {
    const currentSelectedNote = selectedNote.value

    if (!currentSelectedNote) {
      return
    }

    const nextNote = {
      ...currentSelectedNote,
      content,
      description: noteDescriptionFromContent(content),
    }
    selectedNoteFull.value = nextNote
    replaceInStore(nextNote.id, nextNote)
  }

  function findNoteById(id: string): Note | null {
    return allNotes.value.find((note) => note.id === id) ?? null
  }

  function registerEditorFlush(flush: EditorFlush | null): void {
    editorFlush.value = flush
  }

  function clearShouldFocusTitle(): void {
    shouldFocusTitle.value = false
  }

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
    const nextSelectedNoteId =
      id !== null && notes.value.some((note) => note.id === id) ? id : null
    const currentSelectedNote = selectedNoteFull.value

    if (
      nextSelectedNoteId === selectedNoteId.value &&
      (nextSelectedNoteId === null ||
        currentSelectedNote?.id === nextSelectedNoteId)
    ) {
      return
    }

    if (nextSelectedNoteId === null) {
      await editorFlush.value?.()
      selectedNoteId.value = null
      selectedNoteRequestId.value += 1
      selectedNoteFull.value = null
      return
    }

    const requestId = selectedNoteRequestId.value + 1
    selectedNoteRequestId.value = requestId

    await editorFlush.value?.()
    selectedNoteId.value = nextSelectedNoteId

    const loadedNote = findNoteById(nextSelectedNoteId)

    if (selectedNoteRequestId.value !== requestId || !loadedNote) {
      selectedNoteFull.value = null
      return
    }

    selectedNoteFull.value = loadedNote
  }

  const noteMutationsArgs: Parameters<typeof useNoteMutations>[0] = {
    storage,
    notes,
    selectedNote,
    selectedNoteId,
    selectedNoteFull,
    saveError,
    shouldFocusTitle,
    isRenamingNoteTitle,
    editorFlush,
    replaceNote: replaceNoteInStore,
    replaceRenamedNote: replaceRenamedNoteInStore,
    prependNote: prependNoteToStore,
    updateSelectedNoteContent,
    selectNoteById,
  }

  const {
    saveSelectedNoteContent,
    createNote,
    renameSelectedNoteTitle,
    moveNote,
    toggleFavoriteSelectedNote,
    togglePinnedSelectedNote,
    saveWebhookForSelectedNote,
    deleteSelectedNote,
  } = useNoteMutations(noteMutationsArgs)

  async function loadNotes(): Promise<NoteCatalogRow[]> {
    isLoading.value = true
    loadError.value = null

    try {
      const loaded = await storage.value.loadAllNotes()
      const retentionDays = appConfigDisk.value.notes.trashRetentionDays
      const now = new Date()
      const expired = loaded.filter(
        (n) =>
          catalogRowIsTrashed(n) &&
          typeof n.trashedAt === 'string' &&
          trashExpired(n.trashedAt, retentionDays, now),
      )

      if (expired.length > 0) {
        await Promise.all(expired.map((n) => storage.value.deleteNote(n.id)))
      }

      const expiredIds = new Set(expired.map((n) => n.id))
      allNotes.value = loaded.filter((note) => !expiredIds.has(note.id))
      rebuildCatalog()

      return notes.value
    } catch (error) {
      allNotes.value = []
      notes.value = []
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
    catalog: notes,
    findNoteById,
    clearShouldFocusTitle,
    createNote,
    deleteSelectedNote,
    toggleFavoriteSelectedNote,
    togglePinnedSelectedNote,
    saveWebhookForSelectedNote,
    moveNote,
    registerEditorFlush,
    renameSelectedNoteTitle,
    saveSelectedNoteContent,
    selectNoteById,
    loadNotes,
  }
}
