import type { Ref } from 'vue'
import { t } from '~/composables/useTranslations'
import { createNoteCatalogRow } from '~/notes/catalogRow'
import { resolveUniqueNoteIdForParentPath } from '~/notes/noteId'
import { noteWithToggledFavorite } from '~/notes/noteWithToggledFavorite'
import { noteWithToggledPinned } from '~/notes/noteWithToggledPinned'
import { noteWithWebhookUrl } from '~/notes/noteWithWebhookUrl'
import { buildSaveNoteInput } from '~/notes/saveNoteInput'
import type { Note, NoteCatalogRow } from '~/notes/types'

type EditorFlush = () => Promise<void>

type UseNoteMutationsArgs = {
  notes: Ref<NoteCatalogRow[]>
  selectedNote: Ref<Note | null>
  selectedNoteId: Ref<string | null>
  selectedNoteFull: Ref<Note | null>
  saveError: Ref<string | null>
  shouldFocusTitle: Ref<boolean>
  isRenamingNoteTitle: Ref<boolean>
  editorFlush: Ref<EditorFlush | null>
  replaceNote: (note: Note) => void
  replaceRenamedNote: (previousId: string, note: Note) => void
  prependNote: (note: Note) => void
  sortNotesByModifiedAt: (notes: NoteCatalogRow[]) => NoteCatalogRow[]
  updateSelectedNoteContent: (content: string) => void
  selectNoteById: (id: string | null) => Promise<void>
}

export function useNoteMutations({
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
}: UseNoteMutationsArgs) {
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

  async function saveAppPropertyChange(
    transform: (note: Note) => Note,
  ): Promise<void> {
    const current = selectedNote.value

    if (!current) {
      return
    }

    saveError.value = null

    try {
      await editorFlush.value?.()

      const nextNote = transform(current)
      const saveInput = buildSaveNoteInput(nextNote, nextNote.content)

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

  async function toggleFavoriteSelectedNote(): Promise<void> {
    await saveAppPropertyChange(noteWithToggledFavorite)
  }

  async function togglePinnedSelectedNote(): Promise<void> {
    await saveAppPropertyChange(noteWithToggledPinned)
  }

  async function saveWebhookForSelectedNote(url: string): Promise<void> {
    await saveAppPropertyChange((note) => noteWithWebhookUrl(note, url))
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

  return {
    saveSelectedNoteContent,
    createNote,
    renameSelectedNoteTitle,
    moveNote,
    toggleFavoriteSelectedNote,
    togglePinnedSelectedNote,
    saveWebhookForSelectedNote,
    deleteSelectedNote,
  }
}
