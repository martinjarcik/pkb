import { useState } from '#app'
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

  function sortNotesByModifiedAt(
    nextNotes: NoteCatalogRow[],
  ): NoteCatalogRow[] {
    return nextNotes.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
  }

  function replaceNoteRow(previousId: string, nextNote: Note): void {
    notes.value = notes.value.map((note) =>
      note.id === previousId ? createNoteCatalogRow(nextNote) : note,
    )
  }

  function replaceNote(nextNote: Note): void {
    replaceNoteRow(nextNote.id, nextNote)
    notes.value = sortNotesByModifiedAt(notes.value)
  }

  function replaceRenamedNote(previousId: string, nextNote: Note): void {
    replaceNoteRow(previousId, nextNote)
    notes.value = sortNotesByModifiedAt(notes.value)
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
    replaceNoteRow(nextNote.id, nextNote)
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
    selectedNote,
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
      const loadedNotes = await $fetch<NoteCatalogRow[]>('/api/notes')

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
    catalog: notes,
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
