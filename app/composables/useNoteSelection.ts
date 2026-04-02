import { computed, type Ref } from 'vue'
import type { Note, NoteCatalogRow } from '~/notes/types'
import { catalogRowIsTrashed } from '~/notes/trash'

export type EditorFlush = () => Promise<void>

function buildNoteContentPath(id: string): string {
  return `/api/notes/${id.split('/').map(encodeURIComponent).join('/')}`
}

type UseNoteSelectionArgs = {
  notes: Ref<NoteCatalogRow[]>
  editorFlush: Ref<EditorFlush | null>
  selectedNoteId: Ref<string | null>
  selectedNoteFull: Ref<Note | null>
  selectedNoteRequestId: Ref<number>
  replaceNote: (note: Note) => void
}

export function useNoteSelection({
  notes,
  editorFlush,
  selectedNoteId,
  selectedNoteFull,
  selectedNoteRequestId,
  replaceNote,
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
      const loadedNote = await $fetch<Note>(
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

  return {
    selectedNote,
    showNoteControls,
    selectedNoteTitle,
    selectNoteById,
  }
}
