import { ref } from 'vue'
import type { Note, NoteCatalogRow } from '~/notes/types'

export type EditorFlush = () => Promise<void>

const shouldFocusTitle = ref(false)
const editorFlush = ref<EditorFlush | null>(null)
const selectedNoteId = ref<string | null>(null)
const selectedNoteFull = ref<Note | null>(null)
const selectedNoteRequestId = ref(0)

/** Owns the shared active-note selection and editor flush coordination. */
export function useNoteSelection() {
  async function selectNoteById(
    id: string | null,
    rows: readonly NoteCatalogRow[],
    findNoteById: (noteId: string) => Note | null,
  ): Promise<void> {
    const nextSelectedNoteId =
      id !== null && rows.some((row) => row.id === id) ? id : null
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

  function registerEditorFlush(flush: EditorFlush | null): void {
    editorFlush.value = flush
  }

  function clearShouldFocusTitle(): void {
    shouldFocusTitle.value = false
  }

  return {
    shouldFocusTitle,
    editorFlush,
    selectedNoteId,
    selectedNoteFull,
    registerEditorFlush,
    selectNoteById,
    clearShouldFocusTitle,
  }
}
