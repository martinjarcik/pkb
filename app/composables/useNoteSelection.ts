import { ref } from 'vue'
import {
  createEditorDebugTraceId,
  logEditorDebug,
} from '~/lib/editorDebugTrace'
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
    const traceId = createEditorDebugTraceId('select')
    const nextSelectedNoteId =
      id !== null && rows.some((row) => row.id === id) ? id : null
    const currentSelectedNote = selectedNoteFull.value

    logEditorDebug('notes.select.requested', {
      currentNoteId: selectedNoteId.value,
      nextNoteId: nextSelectedNoteId,
      traceId,
    })

    if (
      nextSelectedNoteId === selectedNoteId.value &&
      (nextSelectedNoteId === null ||
        currentSelectedNote?.id === nextSelectedNoteId)
    ) {
      logEditorDebug('notes.select.skipped.sameNote', {
        currentNoteId: selectedNoteId.value,
        traceId,
      })
      return
    }

    if (nextSelectedNoteId === null) {
      await editorFlush.value?.()
      logEditorDebug('notes.select.flushedBeforeClear', {
        currentNoteId: selectedNoteId.value,
        traceId,
      })
      selectedNoteId.value = null
      selectedNoteRequestId.value += 1
      selectedNoteFull.value = null
      logEditorDebug('notes.select.cleared', {
        traceId,
      })
      return
    }

    const requestId = selectedNoteRequestId.value + 1
    selectedNoteRequestId.value = requestId

    await editorFlush.value?.()
    logEditorDebug('notes.select.flushedBeforeSwitch', {
      currentNoteId: selectedNoteId.value,
      nextNoteId: nextSelectedNoteId,
      traceId,
    })
    selectedNoteId.value = nextSelectedNoteId

    const loadedNote = findNoteById(nextSelectedNoteId)

    if (selectedNoteRequestId.value !== requestId || !loadedNote) {
      selectedNoteFull.value = null
      logEditorDebug('notes.select.abortedOrMissingNote', {
        loaded: Boolean(loadedNote),
        nextNoteId: nextSelectedNoteId,
        requestId,
        traceId,
      })
      return
    }

    selectedNoteFull.value = loadedNote
    logEditorDebug('notes.select.completed', {
      nextNoteId: nextSelectedNoteId,
      traceId,
    })
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
