import { computed, type Ref } from 'vue'
import type { Note, NoteCatalogRow } from '~/notes/types'
import { catalogRowIsTrashed } from '~/notes/trash'

export type EditorFlush = () => Promise<void>

type UseNoteSelectionArgs = {
  notes: Ref<NoteCatalogRow[]>
  editorFlush: Ref<EditorFlush | null>
  selectedNoteId: Ref<string | null>
  selectedNoteFull: Ref<Note | null>
  selectedNoteRequestId: Ref<number>
  findNoteById: (id: string) => Note | null
}

export function useNoteSelection({
  notes,
  editorFlush,
  selectedNoteId,
  selectedNoteFull,
  selectedNoteRequestId,
  findNoteById,
}: UseNoteSelectionArgs) {
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

  return {
    selectedNote,
    showNoteControls,
    selectedNoteTitle,
    selectNoteById,
  }
}
