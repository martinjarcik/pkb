import { useState } from '#app'
import { computed } from 'vue'
import { loadConfig } from '~/config/loader'
import { t } from '~/composables/useTranslations'
import { createNoteCatalogRow } from '~/notes/catalogRow'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import { resolveUniqueNoteIdForParentPath } from '~/notes/renameNoteTitle'
import { noteWithToggledFavorite } from '~/notes/noteWithToggledFavorite'
import { noteWithToggledPinned } from '~/notes/noteWithToggledPinned'
import { buildSaveNoteInput } from '~/notes/saveNoteInput'
import type { Note, NoteCatalogRow } from '~/notes/types'
import { catalogRowIsTrashed } from '~/notes/trash'

function buildNoteContentPath(id: string): string {
  return `/api/notes/${id.split('/').map(encodeURIComponent).join('/')}`
}

const defaultEditor = loadConfig().editor

export function useNotes() {
  type EditorFlush = () => Promise<void>

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
  const selectedNote = computed(() =>
    selectedNoteFull.value?.id === selectedNoteId.value
      ? selectedNoteFull.value
      : null,
  )
  const showNoteControls = computed(
    () =>
      selectedNote.value !== null && !catalogRowIsTrashed(selectedNote.value),
  )
  const selectedNoteTitle = computed(() => {
    if (selectedNote.value) {
      return selectedNote.value.title
    }

    if (selectedNoteId.value) {
      const catalogRow = notes.value.find(
        (note) => note.id === selectedNoteId.value,
      )

      return catalogRow?.title ?? ''
    }

    return ''
  })
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

  async function selectNoteById(id: string | null): Promise<void> {
    const nextSelectedNoteId =
      id !== null && notes.value.some((note) => note.id === id) ? id : null

    if (
      nextSelectedNoteId === selectedNoteId.value &&
      (nextSelectedNoteId === null ||
        selectedNote.value?.id === nextSelectedNoteId)
    ) {
      return
    }

    await editorFlush.value?.()
    selectedNoteId.value = nextSelectedNoteId

    if (nextSelectedNoteId === null) {
      selectedNoteRequestId.value += 1
      selectedNoteFull.value = null
      return
    }

    selectedNoteFull.value = null

    const requestId = selectedNoteRequestId.value + 1
    selectedNoteRequestId.value = requestId

    try {
      const loadedNote = await globalThis.$fetch<Note>(
        buildNoteContentPath(nextSelectedNoteId),
      )

      if (selectedNoteRequestId.value !== requestId) {
        return
      }

      selectedNoteFull.value = loadedNote
      replaceNote(loadedNote)
    } catch {
      if (selectedNoteRequestId.value === requestId) {
        selectedNoteFull.value = null
      }
    }
  }

  async function saveSelectedNoteContent(content: string): Promise<void> {
    if (!selectedNote.value) {
      return
    }

    saveError.value = null
    const saveInput = buildSaveNoteInput(selectedNote.value, content)
    updateSelectedNoteContent(content)

    try {
      const savedNote = await globalThis.$fetch<Note>('/api/notes', {
        method: 'PUT',
        body: saveInput,
      })

      replaceNote(savedNote)
      selectedNoteFull.value = savedNote
    } catch (error) {
      saveError.value =
        error instanceof Error ? error.message : t('notes.errorSaveFallback')
    }
  }

  async function createNote(
    parentPath: string = '',
    initialProperties: Record<string, unknown> = {},
  ): Promise<Note | null> {
    const translatedDefaultTitle = t('notes.newNoteTitle').trim()
    const defaultTitle =
      translatedDefaultTitle.length === 0 ||
      translatedDefaultTitle === 'notes.newNoteTitle'
        ? 'New Note'
        : translatedDefaultTitle

    if (defaultTitle.length === 0) {
      return null
    }

    saveError.value = null
    shouldFocusTitle.value = false

    try {
      await editorFlush.value?.()

      const createdNote = await globalThis.$fetch<Note>('/api/notes', {
        method: 'PUT',
        body: {
          id: resolveUniqueNoteIdForParentPath(
            parentPath,
            defaultTitle,
            notes.value.map((note) => note.id),
          ),
          properties: initialProperties,
          content: '',
        },
      })

      prependNote(createdNote)
      selectedNoteId.value = createdNote.id
      selectedNoteFull.value = createdNote
      shouldFocusTitle.value = true

      return createdNote
    } catch (error) {
      saveError.value =
        error instanceof Error ? error.message : t('notes.errorCreateFallback')

      return null
    }
  }

  async function renameSelectedNoteTitle(title: string): Promise<Note | null> {
    const currentNote = selectedNote.value
    const trimmedTitle = title.trim()

    if (
      !currentNote ||
      isRenamingNoteTitle.value ||
      trimmedTitle.length === 0
    ) {
      return null
    }

    const currentId = currentNote.id

    saveError.value = null
    isRenamingNoteTitle.value = true

    try {
      await editorFlush.value?.()

      const renamedNote = await globalThis.$fetch<Note>('/api/notes', {
        method: 'PATCH',
        body: {
          id: currentId,
          title: trimmedTitle,
        },
      })

      replaceRenamedNote(currentId, renamedNote)

      if (selectedNoteId.value === currentId) {
        selectedNoteId.value = renamedNote.id
        selectedNoteFull.value = renamedNote
      }

      return renamedNote
    } catch (error) {
      saveError.value =
        error instanceof Error ? error.message : t('notes.errorRenameFallback')

      return null
    } finally {
      isRenamingNoteTitle.value = false
    }
  }

  async function moveNote(
    id: string,
    targetParentPath: string,
  ): Promise<Note | null> {
    if (!notes.value.some((note) => note.id === id)) {
      return null
    }

    saveError.value = null

    try {
      await editorFlush.value?.()

      const movedNote = await globalThis.$fetch<Note>('/api/notes/move', {
        method: 'POST',
        body: {
          id,
          targetParentPath,
        },
      })

      replaceRenamedNote(id, movedNote)

      if (selectedNoteId.value === id) {
        selectedNoteId.value = movedNote.id
        selectedNoteFull.value = movedNote
      }

      return movedNote
    } catch (error) {
      saveError.value =
        error instanceof Error ? error.message : t('notes.errorSaveFallback')

      return null
    }
  }

  async function toggleFavoriteSelectedNote(): Promise<void> {
    const current = selectedNote.value

    if (!current) {
      return
    }

    saveError.value = null

    try {
      await editorFlush.value?.()

      const toggled = noteWithToggledFavorite(current)
      const saveInput = buildSaveNoteInput(toggled, toggled.content)

      const savedNote = await globalThis.$fetch<Note>('/api/notes', {
        method: 'PUT',
        body: saveInput,
      })

      replaceNote(savedNote)
      selectedNoteFull.value = savedNote
    } catch (error) {
      saveError.value =
        error instanceof Error ? error.message : t('notes.errorSaveFallback')
    }
  }

  async function togglePinnedSelectedNote(): Promise<void> {
    const current = selectedNote.value

    if (!current) {
      return
    }

    saveError.value = null

    try {
      await editorFlush.value?.()

      const toggled = noteWithToggledPinned(current)
      const saveInput = buildSaveNoteInput(toggled, toggled.content)

      const savedNote = await globalThis.$fetch<Note>('/api/notes', {
        method: 'PUT',
        body: saveInput,
      })

      replaceNote(savedNote)
      selectedNoteFull.value = savedNote
    } catch (error) {
      saveError.value =
        error instanceof Error ? error.message : t('notes.errorSaveFallback')
    }
  }

  async function deleteSelectedNote(
    visibleNoteIds: readonly string[],
  ): Promise<boolean> {
    const noteToDelete = selectedNote.value

    if (!noteToDelete) {
      return false
    }

    const deletedVisibleIndex = visibleNoteIds.indexOf(noteToDelete.id)

    saveError.value = null

    try {
      await editorFlush.value?.()

      const trashedNote = await globalThis.$fetch<Note>('/api/notes/trash', {
        method: 'POST',
        body: { id: noteToDelete.id },
      })

      notes.value = sortNotesByModifiedAt(
        notes.value.map((note) =>
          note.id === trashedNote.id ? createNoteCatalogRow(trashedNote) : note,
        ),
      )
      selectedNoteFull.value = null
      selectedNoteId.value = null

      const remainingVisibleIds = visibleNoteIds.filter(
        (id) => id !== noteToDelete.id,
      )
      const nextIndex = Math.min(
        deletedVisibleIndex,
        remainingVisibleIds.length - 1,
      )
      await selectNoteById(remainingVisibleIds[nextIndex] ?? null)

      return true
    } catch (error) {
      saveError.value =
        error instanceof Error ? error.message : t('notes.errorDeleteFallback')

      return false
    }
  }

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
    moveNote,
    registerEditorFlush,
    renameSelectedNoteTitle,
    saveSelectedNoteContent,
    selectNoteById,
    loadNotes,
  }
}
