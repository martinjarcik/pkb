import type { ComputedRef, Ref } from 'vue'
import { t } from '~/composables/useTranslations'
import type { EditorFlush } from '~/composables/useNoteSelection'
import { resolveUniqueNoteIdForParentPath } from '~/notes/noteId'
import { noteWithToggledFavorite } from '~/notes/noteWithToggledFavorite'
import { noteWithToggledPinned } from '~/notes/noteWithToggledPinned'
import { noteWithToggledWide } from '~/notes/noteWithToggledWide'
import { noteWithWebhookUrl } from '~/notes/noteWithWebhookUrl'
import { buildSaveNoteInput } from '~/notes/saveNoteInput'
import { dispatchNoteWebhook } from '~/notes/webhook'
import type { Note, NoteCatalogRow, NoteProperties } from '~/notes/types'
import type { NoteStorage } from '~/storage/types'

type UseNoteMutationsArgs = {
  storage: ComputedRef<NoteStorage>
  catalogState: {
    notes: Ref<NoteCatalogRow[]>
    findNoteById: (id: string) => Note | null
    replaceNote: (note: Note) => void
    replaceRenamedNote: (previousId: string, note: Note) => void
    prependNote: (note: Note) => void
    updateNoteContent: (id: string, content: string) => Note | null
  }
  selectionState: {
    editorFlush: Ref<EditorFlush | null>
    selectedNote: Ref<Note | null>
    selectedNoteId: Ref<string | null>
    selectedNoteFull: Ref<Note | null>
    shouldFocusTitle: Ref<boolean>
    selectNoteById: (id: string | null) => Promise<void>
  }
  saveError: Ref<string | null>
  isRenamingNoteTitle: Ref<boolean>
}

/** Creates the async note mutation commands over the shared catalog and selection state. */
export function useNoteMutations({
  storage,
  catalogState,
  selectionState,
  saveError,
  isRenamingNoteTitle,
}: UseNoteMutationsArgs) {
  const {
    notes,
    findNoteById,
    replaceNote,
    replaceRenamedNote,
    prependNote,
    updateNoteContent,
  } = catalogState
  const {
    editorFlush,
    selectedNote,
    selectedNoteId,
    selectedNoteFull,
    shouldFocusTitle,
    selectNoteById,
  } = selectionState

  function existingNoteIds(): string[] {
    return notes.value.map((note) => note.id)
  }

  function syncSelectedNote(nextNote: Note): void {
    selectedNoteId.value = nextNote.id
    selectedNoteFull.value = nextNote
  }

  async function executeNoteCommand<T>(
    operation: () => Promise<T>,
    fallbackErrorKey: string,
  ): Promise<T | null> {
    saveError.value = null

    try {
      await editorFlush.value?.()
      return await operation()
    } catch (error) {
      saveError.value =
        error instanceof Error ? error.message : t(fallbackErrorKey)

      return null
    }
  }

  async function saveSelectedNoteContent(content: string): Promise<void> {
    const currentNote = selectedNote.value

    if (!currentNote) {
      return
    }

    const saveInput = buildSaveNoteInput(currentNote, content)
    const optimisticNote = updateNoteContent(currentNote.id, content)

    saveError.value = null

    let savedNote: Note | null
    try {
      savedNote = await storage.value.saveNote(saveInput)
    } catch (error) {
      saveError.value =
        error instanceof Error ? error.message : t('notes.errorSaveFallback')

      if (optimisticNote) {
        replaceNote(currentNote)
        selectedNoteFull.value = currentNote
      }
      return
    }

    replaceNote(savedNote)
    selectedNoteFull.value = savedNote
    void dispatchWebhookIfPresent(savedNote, 'updated')
  }

  async function createNote(
    parentPath: string = '',
    initialProperties: NoteProperties = {},
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

    shouldFocusTitle.value = false

    const createdNote = await executeNoteCommand(
      () =>
        storage.value.saveNote({
          id: resolveUniqueNoteIdForParentPath(
            parentPath,
            defaultTitle,
            existingNoteIds(),
          ),
          properties: initialProperties,
          content: '',
        }),
      'notes.errorCreateFallback',
    )

    if (!createdNote) {
      return null
    }

    prependNote(createdNote)
    syncSelectedNote(createdNote)
    shouldFocusTitle.value = true

    return createdNote
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

    isRenamingNoteTitle.value = true

    try {
      const renamedNote = await executeNoteCommand(
        () =>
          storage.value.renameNoteTitle({
            id: currentId,
            title: trimmedTitle,
            existingIds: existingNoteIds(),
            note: currentNote,
          }),
        'notes.errorRenameFallback',
      )

      if (!renamedNote) {
        return null
      }

      replaceRenamedNote(currentId, renamedNote)

      if (selectedNoteId.value === currentId) {
        syncSelectedNote(renamedNote)
      }

      return renamedNote
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

    const note = findNoteById(id)

    if (!note) {
      return null
    }

    const movedNote = await executeNoteCommand(
      () =>
        storage.value.moveNote({
          id,
          targetParentPath,
          existingIds: existingNoteIds(),
          note,
        }),
      'notes.errorSaveFallback',
    )

    if (!movedNote) {
      return null
    }

    replaceRenamedNote(id, movedNote)

    if (selectedNoteId.value === id) {
      syncSelectedNote(movedNote)
    }

    return movedNote
  }

  async function saveAppPropertyChange(
    transform: (note: Note) => Note,
  ): Promise<void> {
    const current = selectedNote.value

    if (!current) {
      return
    }

    const nextNote = transform(current)
    const saveInput = buildSaveNoteInput(nextNote, nextNote.content)
    const savedNote = await executeNoteCommand(
      () => storage.value.saveNote(saveInput),
      'notes.errorSaveFallback',
    )

    if (!savedNote) {
      return
    }

    replaceNote(savedNote)
    selectedNoteFull.value = savedNote
    void dispatchWebhookIfPresent(savedNote, 'updated')
  }

  async function toggleFavoriteSelectedNote(): Promise<void> {
    await saveAppPropertyChange(noteWithToggledFavorite)
  }

  async function togglePinnedSelectedNote(): Promise<void> {
    await saveAppPropertyChange(noteWithToggledPinned)
  }

  async function toggleWideSelectedNote(): Promise<void> {
    await saveAppPropertyChange(noteWithToggledWide)
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

    const trashedNote = await executeNoteCommand(
      () => storage.value.softDeleteNote(noteToDelete.id, noteToDelete),
      'notes.errorDeleteFallback',
    )

    if (!trashedNote) {
      return false
    }

    replaceNote(trashedNote)
    void dispatchWebhookIfPresent(trashedNote, 'deleted')
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
  }

  async function dispatchWebhookIfPresent(
    note: Note,
    event: 'updated' | 'deleted',
  ): Promise<void> {
    const hook = note.webhook

    if (typeof hook !== 'string' || hook.length === 0) {
      return
    }

    await dispatchNoteWebhook(hook, event, note)
  }

  return {
    saveSelectedNoteContent,
    createNote,
    renameSelectedNoteTitle,
    moveNote,
    toggleFavoriteSelectedNote,
    togglePinnedSelectedNote,
    toggleWideSelectedNote,
    saveWebhookForSelectedNote,
    deleteSelectedNote,
  }
}
