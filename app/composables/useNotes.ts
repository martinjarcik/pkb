import { useState } from '#app'
import { computed } from 'vue'
import { noteTitleFromId } from '~/notes/noteTitleFromId'
import { buildSaveNoteInput } from '~/notes/saveNoteInput'
import type { Note } from '~/notes/types'

export type NotesListItem = {
  id: string
  title: string
  description: string
  meta: string
}

function stripMarkdownSyntax(line: string): string {
  return line
    .replace(/^>\s?/, '')
    .replace(/^[-*+]\s+\[(?: |x|X)\]\s+/, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\\([[\]`*_{}()#+\-.!|>])/g, '$1')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isMarkdownTableSeparator(line: string): boolean {
  return line.includes('|') && /^[\s|:-]+$/.test(line) && line.includes('-')
}

// Keep list presentation in this file until a second list-specific consumer appears.
function createNotesListDescription(content: string): string {
  const previewLines: string[] = []
  let isInsideFencedCodeBlock = false

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (/^(```|~~~)/.test(trimmedLine)) {
      isInsideFencedCodeBlock = !isInsideFencedCodeBlock
      continue
    }

    if (
      trimmedLine.length === 0 ||
      isInsideFencedCodeBlock ||
      /^#{1,6}\s+/.test(trimmedLine) ||
      /^([-*_]\s*){3,}$/.test(trimmedLine) ||
      isMarkdownTableSeparator(trimmedLine)
    ) {
      continue
    }

    const sanitizedLine = stripMarkdownSyntax(trimmedLine)

    if (sanitizedLine.length === 0) {
      continue
    }

    previewLines.push(sanitizedLine)
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
    title: noteTitleFromId(note.id),
    description: createNotesListDescription(note.content),
    meta: createNotesListMeta(note.modifiedAt),
  }))
}

export function useNotes() {
  type EditorFlush = () => Promise<void>

  const notes = useState<Note[]>('notes.items', () => [])
  const isLoading = useState('notes.isLoading', () => false)
  const loadError = useState<string | null>('notes.loadError', () => null)
  const saveError = useState<string | null>('notes.saveError', () => null)
  const editorFlush = useState<EditorFlush | null>(
    'notes.editorFlush',
    () => null,
  )
  const selectedNoteId = useState<string | null>(
    'notes.selectedNoteId',
    () => null,
  )
  const selectedNote = computed(
    () => notes.value.find((note) => note.id === selectedNoteId.value) ?? null,
  )
  const selectedNoteTitle = computed(() =>
    selectedNote.value ? noteTitleFromId(selectedNote.value.id) : '',
  )
  const listItems = computed(() => createNotesListItems(notes.value))

  function replaceNote(nextNote: Note): void {
    notes.value = notes.value
      .map((note) => (note.id === nextNote.id ? nextNote : note))
      .sort(
        (a, b) =>
          new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
      )
  }

  function updateSelectedNoteContent(content: string): void {
    if (!selectedNote.value) {
      return
    }

    notes.value = notes.value.map((note) =>
      note.id === selectedNote.value?.id ? { ...note, content } : note,
    )
  }

  function registerEditorFlush(flush: EditorFlush | null): void {
    editorFlush.value = flush
  }

  async function selectNoteById(id: string | null): Promise<void> {
    const nextSelectedNoteId =
      id !== null && notes.value.some((note) => note.id === id) ? id : null

    if (nextSelectedNoteId === selectedNoteId.value) {
      return
    }

    await editorFlush.value?.()
    selectedNoteId.value = nextSelectedNoteId
  }

  async function saveSelectedNoteContent(content: string): Promise<void> {
    if (!selectedNote.value) {
      return
    }

    saveError.value = null
    updateSelectedNoteContent(content)

    try {
      const savedNote = await globalThis.$fetch<Note>('/api/notes', {
        method: 'PUT',
        body: buildSaveNoteInput(selectedNote.value, content),
      })

      replaceNote(savedNote)
    } catch (error) {
      saveError.value =
        error instanceof Error ? error.message : 'Failed to save note'
    }
  }

  async function loadNotes(): Promise<Note[]> {
    isLoading.value = true
    loadError.value = null

    try {
      const loadedNotes = await globalThis.$fetch<Note[]>('/api/notes')

      notes.value = loadedNotes
      await selectNoteById(loadedNotes[0]?.id ?? null)

      return loadedNotes
    } catch (error) {
      notes.value = []
      await selectNoteById(null)
      loadError.value =
        error instanceof Error ? error.message : 'Failed to load notes'

      return []
    } finally {
      isLoading.value = false
    }
  }

  return {
    notes,
    isLoading,
    loadError,
    saveError,
    selectedNoteId,
    selectedNote,
    selectedNoteTitle,
    listItems,
    registerEditorFlush,
    saveSelectedNoteContent,
    selectNoteById,
    loadNotes,
  }
}
