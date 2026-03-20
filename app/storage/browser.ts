import type { NoteStorage } from './types'
import type { Note } from '~/notes/types'

const STORAGE_KEY = 'notes'

function isNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.modifiedAt === 'string'
  )
}

function parseNotes(raw: string | null): Note[] {
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) return []
  return parsed.filter(isNote)
}

export const browserStorage: NoteStorage = {
  async loadNotes(): Promise<Note[]> {
    return parseNotes(localStorage.getItem(STORAGE_KEY))
  },

  async saveNote(note: Note): Promise<void> {
    const notes = parseNotes(localStorage.getItem(STORAGE_KEY))
    const next = [...notes.filter((n) => n.id !== note.id), note]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  },

  async deleteNote(id: string): Promise<void> {
    const notes = parseNotes(localStorage.getItem(STORAGE_KEY))
    const next = notes.filter((n) => n.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  },
}
