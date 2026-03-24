import { useState } from '#app'
import { computed } from 'vue'
import type { Note } from '~/notes/types'

export type NotesListItem = {
  id: string
  title: string
  description: string
  meta: string
}

// Keep list presentation in this file until a second list-specific consumer appears.
function createNotesListDescription(content: string): string {
  const previewLines: string[] = []

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (trimmedLine.length === 0 || /^#{1,6}\s+/.test(trimmedLine)) {
      continue
    }

    previewLines.push(trimmedLine)
  }

  const normalizedContent = previewLines.join(' ').replace(/\s+/g, ' ').trim()

  if (normalizedContent.length <= 120) {
    return normalizedContent
  }

  return `${normalizedContent.slice(0, 117)}...`
}

function createNotesListMeta(modifiedAt: string): string {
  return modifiedAt.slice(0, 10)
}

export function createNotesListItems(notes: Note[]): NotesListItem[] {
  return notes.map((note) => ({
    id: note.id,
    title: note.id,
    description: createNotesListDescription(note.content),
    meta: createNotesListMeta(note.modifiedAt),
  }))
}

export function useNotes() {
  const notes = useState<Note[]>('notes.items', () => [])
  const isLoading = useState('notes.isLoading', () => false)
  const loadError = useState<string | null>('notes.loadError', () => null)
  const selectedNoteId = useState<string | null>(
    'notes.selectedNoteId',
    () => null,
  )
  const selectedNote = computed(
    () => notes.value.find((note) => note.id === selectedNoteId.value) ?? null,
  )
  const listItems = computed(() => createNotesListItems(notes.value))

  function selectNoteById(id: string | null): void {
    selectedNoteId.value =
      id !== null && notes.value.some((note) => note.id === id) ? id : null
  }

  async function loadNotes(): Promise<Note[]> {
    isLoading.value = true
    loadError.value = null

    try {
      const loadedNotes = await globalThis.$fetch<Note[]>('/api/notes')

      notes.value = loadedNotes
      selectNoteById(loadedNotes[0]?.id ?? null)

      return loadedNotes
    } catch (error) {
      notes.value = []
      selectNoteById(null)
      loadError.value =
        error instanceof Error ? error.message : 'Failed to load notes'

      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    notes,
    isLoading,
    loadError,
    selectedNoteId,
    selectedNote,
    listItems,
    selectNoteById,
    loadNotes,
  }
}
