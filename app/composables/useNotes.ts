import { computed, ref } from 'vue'
import { loadConfig } from '~/config/loader'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useNoteMutations } from '~/composables/useNoteMutations'
import { useNoteStorage } from '~/composables/useNoteStorage'
import { t } from '~/composables/useTranslations'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import { catalogRowIsTrashed, trashExpired } from '~/notes/trash'
import type { Note, NoteCatalogRow } from '~/notes/types'

const defaultEditor = loadConfig().editor
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
  const editorAutosaveDelay = defaultEditor.autosaveDelay
  const { storage } = useNoteStorage()
  const { data: appConfigDisk } = useAppConfigDisk()

  function rebuildCatalog(): void {
    notes.value = sortNotesByModifiedAt(
      allNotes.value as unknown as NoteCatalogRow[],
    )
  }

  function sortNotesByModifiedAt(
    nextNotes: NoteCatalogRow[],
  ): NoteCatalogRow[] {
    return nextNotes.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
  }

  function replaceNoteInStore(nextNote: Note): void {
    const nextNotes: Note[] = []
    const currentNotes = allNotes.value as unknown as Array<{ id: string }>

    for (const note of currentNotes) {
      if (note.id === nextNote.id) {
        nextNotes.push(nextNote)
      } else {
        nextNotes.push(note as Note)
      }
    }

    allNotes.value = nextNotes
    rebuildCatalog()
  }

  function replaceRenamedNoteInStore(previousId: string, nextNote: Note): void {
    const nextNotes: Note[] = []
    const currentNotes = allNotes.value as unknown as Array<{ id: string }>

    for (const note of currentNotes) {
      if (note.id === previousId) {
        nextNotes.push(nextNote)
      } else {
        nextNotes.push(note as Note)
      }
    }

    allNotes.value = nextNotes
    rebuildCatalog()
  }

  function prependNoteToStore(nextNote: Note): void {
    const nextNotes: Note[] = [nextNote]
    const currentNotes = allNotes.value as unknown as Array<{ id: string }>

    for (const note of currentNotes) {
      if (note.id !== nextNote.id) {
        nextNotes.push(note as Note)
      }
    }

    allNotes.value = nextNotes
    rebuildCatalog()
  }

  function updateSelectedNoteContent(content: string): void {
    const currentSelectedNote = selectedNote.value as Note | null

    if (!currentSelectedNote) {
      return
    }

    const nextNote = {
      ...currentSelectedNote,
      content,
      description: noteDescriptionFromContent(content),
    }
    selectedNoteFull.value = nextNote
    const nextNotes: Note[] = []
    const currentNotes = allNotes.value as unknown as Array<{ id: string }>

    for (const note of currentNotes) {
      if (note.id === nextNote.id) {
        nextNotes.push(nextNote)
      } else {
        nextNotes.push(note as Note)
      }
    }

    allNotes.value = nextNotes
    rebuildCatalog()
  }

  function findNoteById(id: string): Note | null {
    const currentNotes = allNotes.value as unknown as Array<{ id: string }>

    for (const note of currentNotes) {
      if (note.id === id) {
        return note as Note
      }
    }

    return null
  }

  function registerEditorFlush(flush: EditorFlush | null): void {
    editorFlush.value = flush
  }

  function clearShouldFocusTitle(): void {
    shouldFocusTitle.value = false
  }

  const selectedNote = selectedNoteFull
  const showNoteControls = computed(() => {
    const currentSelectedNote = selectedNote.value as Note | null

    return (
      currentSelectedNote !== null && !catalogRowIsTrashed(currentSelectedNote)
    )
  })
  const selectedNoteTitle = computed(() => {
    const currentSelectedNote = selectedNote.value as Note | null

    if (currentSelectedNote) {
      return currentSelectedNote.title
    }

    if (selectedNoteId.value) {
      const currentCatalog = notes.value as unknown as Array<{
        id: string
        title: string
      }>

      for (const note of currentCatalog) {
        if (note.id === selectedNoteId.value) {
          return note.title
        }
      }

      return ''
    }

    return ''
  })

  async function selectNoteById(id: string | null): Promise<void> {
    let nextSelectedNoteId: string | null = null

    if (id !== null) {
      const currentCatalog = notes.value as unknown as Array<{ id: string }>

      for (const note of currentCatalog) {
        if (note.id === id) {
          nextSelectedNoteId = id
          break
        }
      }
    }

    const currentSelectedNote = selectedNoteFull.value as Note | null

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
      const nextNotes: Note[] = []
      const currentLoadedNotes = loaded as unknown as Array<{ id: string }>

      for (const note of currentLoadedNotes) {
        if (!expiredIds.has(note.id)) {
          nextNotes.push(note as Note)
        }
      }

      allNotes.value = nextNotes
      rebuildCatalog()

      return notes.value as unknown as NoteCatalogRow[]
    } catch (error) {
      allNotes.value = []
      notes.value = []
      selectedNoteFull.value = null
      await selectNoteById(null)
      loadError.value =
        error instanceof Error ? error.message : t('notes.errorLoadFallback')

      return [] as NoteCatalogRow[]
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
