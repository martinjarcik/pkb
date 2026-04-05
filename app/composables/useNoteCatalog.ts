import { ref } from 'vue'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import type { Note, NoteCatalogRow } from '~/notes/types'

const allNotes = ref<Note[]>([])
const notes = ref<NoteCatalogRow[]>([])
const isLoading = ref(false)
const loadError = ref<string | null>(null)

function sortNotesByModifiedAt(
  nextNotes: readonly NoteCatalogRow[],
): NoteCatalogRow[] {
  return [...nextNotes].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
}

/** Owns the shared note store and the derived note catalog rows. */
export function useNoteCatalog() {
  function rebuildCatalog(): void {
    notes.value = sortNotesByModifiedAt(allNotes.value as NoteCatalogRow[])
  }

  function setAllNotes(nextNotes: Note[]): void {
    allNotes.value = nextNotes
    rebuildCatalog()
  }

  function clearAllNotes(): void {
    allNotes.value = []
    notes.value = []
  }

  function replaceInStore(matchId: string, replacement: Note): void {
    const nextNotes: Note[] = []

    for (const note of allNotes.value) {
      if (note.id === matchId) {
        nextNotes.push(replacement)
        continue
      }

      nextNotes.push(note as Note)
    }

    allNotes.value = nextNotes
    rebuildCatalog()
  }

  function replaceNote(nextNote: Note): void {
    replaceInStore(nextNote.id, nextNote)
  }

  function replaceRenamedNote(previousId: string, nextNote: Note): void {
    replaceInStore(previousId, nextNote)
  }

  function prependNote(nextNote: Note): void {
    allNotes.value = [
      nextNote,
      ...allNotes.value.filter((note) => note.id !== nextNote.id),
    ]
    rebuildCatalog()
  }

  function findNoteById(id: string): Note | null {
    return allNotes.value.find((note) => note.id === id) ?? null
  }

  function updateNoteContent(id: string, content: string): Note | null {
    const note = findNoteById(id)

    if (!note) {
      return null
    }

    const nextNote = {
      ...note,
      content,
      description: noteDescriptionFromContent(content),
    }

    replaceNote(nextNote)

    return nextNote
  }

  return {
    allNotes,
    notes,
    isLoading,
    loadError,
    setAllNotes,
    clearAllNotes,
    replaceNote,
    replaceRenamedNote,
    prependNote,
    findNoteById,
    updateNoteContent,
  }
}
