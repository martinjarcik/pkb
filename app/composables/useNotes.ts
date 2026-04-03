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
import { catalogRowIsTrashed, trashExpired } from '~/notes/trash'
import type { Note, NoteCatalogRow } from '~/notes/types'

const defaultEditor = loadConfig().editor

export function useNotes() {
  const editorAutosaveDelay = defaultEditor.autosaveDelay
  const { storage } = useNoteStorage()
  const { data: appConfigDisk } = useAppConfigDisk()
  const allNotes = useState<Note[]>('notes.allNotes', () => [])
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

  function rebuildCatalog(): void {
    notes.value = sortNotesByModifiedAt(
      allNotes.value.map(createNoteCatalogRow),
    )
  }

  function sortNotesByModifiedAt(
    nextNotes: NoteCatalogRow[],
  ): NoteCatalogRow[] {
    return nextNotes.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
  }

  function replaceNoteInStore(nextNote: Note): void {
    allNotes.value = allNotes.value.map((n) =>
      n.id === nextNote.id ? nextNote : n,
    )
    rebuildCatalog()
  }

  function replaceRenamedNoteInStore(previousId: string, nextNote: Note): void {
    allNotes.value = allNotes.value.map((n) =>
      n.id === previousId ? nextNote : n,
    )
    rebuildCatalog()
  }

  function prependNoteToStore(nextNote: Note): void {
    allNotes.value = [
      nextNote,
      ...allNotes.value.filter((n) => n.id !== nextNote.id),
    ]
    rebuildCatalog()
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
    allNotes.value = allNotes.value.map((n) =>
      n.id === nextNote.id ? nextNote : n,
    )
    notes.value = notes.value.map((row) =>
      row.id === nextNote.id ? createNoteCatalogRow(nextNote) : row,
    )
  }

  function findNoteById(id: string): Note | null {
    return allNotes.value.find((n) => n.id === id) ?? null
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
      findNoteById,
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
    replaceNote: replaceNoteInStore,
    replaceRenamedNote: replaceRenamedNoteInStore,
    prependNote: prependNoteToStore,
    updateSelectedNoteContent,
    selectNoteById,
  })

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
      allNotes.value = loaded.filter((n) => !expiredIds.has(n.id))
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
