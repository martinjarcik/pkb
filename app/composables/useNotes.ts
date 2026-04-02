import { useState } from '#app'
import { computed } from 'vue'
import { loadConfig } from '~/config/loader'
import { t } from '~/composables/useTranslations'
import { useNoteMutations } from '~/composables/useNoteMutations'
import {
  type EditorFlush,
  useNoteSelection,
} from '~/composables/useNoteSelection'
import { createNoteCatalogRow } from '~/notes/catalogRow'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import type { Note, NoteCatalogRow } from '~/notes/types'

const defaultEditor = loadConfig().editor

export function useNotes() {
  const editorAutosaveDelay = defaultEditor.autosaveDelay
  const notes = useState<NoteCatalogRow[]>('notes.items', () => [])
  const isLoading = useState('notes.isLoading', () => false)
  const isRenamingNoteTitle = useState('notes.isRenamingNoteTitle', () => false)
  const loadError = useState<string | null>('notes.loadError', () => null)
  const saveError = useState<string | null>('notes.saveError', () => null)
  const editorFlush = useState<EditorFlush | null>(
    'notes.editorFlush',
    () => null,
  )
  const shouldFocusTitle = useState('notes.shouldFocusTitle', () => false)
  const selectedNoteId = useState<string | null>(
    'notes.selectedNoteId',
    () => null,
  )
  const selectedNoteFull = useState<Note | null>(
    'notes.selectedNoteFull',
    () => null,
  )
  const selectedNoteRequestId = useState('notes.selectedNoteRequestId', () => 0)
  const catalog = computed(() => notes.value)

  function sortNotesByModifiedAt(
    nextNotes: NoteCatalogRow[],
  ): NoteCatalogRow[] {
    return nextNotes.sort(
      (a, b) =>
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
    )
  }

  function replaceNote(nextNote: Note): void {
    notes.value = sortNotesByModifiedAt(
      notes.value.map((note) =>
        note.id === nextNote.id ? createNoteCatalogRow(nextNote) : note,
      ),
    )
  }

  function replaceRenamedNote(previousId: string, nextNote: Note): void {
    notes.value = sortNotesByModifiedAt(
      notes.value.map((note) =>
        note.id === previousId ? createNoteCatalogRow(nextNote) : note,
      ),
    )
  }

  function prependNote(nextNote: Note): void {
    notes.value = [
      createNoteCatalogRow(nextNote),
      ...notes.value.filter((note) => note.id !== nextNote.id),
    ]
  }

  function updateSelectedNoteContent(content: string): void {
    if (!selectedNote.value) {
      return
    }

    const nextNote = {
      ...selectedNote.value,
      content,
      description: noteDescriptionFromContent(content),
    }
    selectedNoteFull.value = nextNote
    replaceNote(nextNote)
  }

  function registerEditorFlush(flush: EditorFlush | null): void {
    editorFlush.value = flush
  }

  function clearShouldFocusTitle(): void {
    shouldFocusTitle.value = false
  }

  const { selectedNote, showNoteControls, selectedNoteTitle, selectNoteById } =
    useNoteSelection({
      notes,
      editorFlush,
      selectedNoteId,
      selectedNoteFull,
      selectedNoteRequestId,
      replaceNote,
    })

  const {
    saveSelectedNoteContent,
    createNote,
    renameSelectedNoteTitle,
    moveNote,
    toggleFavoriteSelectedNote,
    togglePinnedSelectedNote,
    saveWebhookForSelectedNote,
    deleteSelectedNote,
  } = useNoteMutations({
    notes,
    selectedNote,
    selectedNoteId,
    selectedNoteFull,
    saveError,
    shouldFocusTitle,
    isRenamingNoteTitle,
    editorFlush,
    replaceNote,
    replaceRenamedNote,
    prependNote,
    sortNotesByModifiedAt,
    updateSelectedNoteContent,
    selectNoteById,
  })

  async function loadNotes(): Promise<NoteCatalogRow[]> {
    isLoading.value = true
    loadError.value = null

    try {
      const loadedNotes =
        await globalThis.$fetch<NoteCatalogRow[]>('/api/notes')

      notes.value = loadedNotes

      return loadedNotes
    } catch (error) {
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
    catalog,
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
