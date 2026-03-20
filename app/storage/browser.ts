import type { Note } from '~/notes/types'
import type { NoteStorage, SaveNoteInput } from './types'
import { parseDocument, serializeDocument } from './document'

const STORAGE_KEY = 'notes'

type BrowserStoredNote = {
  document: string
  createdAt: string
  modifiedAt: string
}

type BrowserStoredNotes = Record<string, BrowserStoredNote>

function coerceBrowserStoredNote(value: unknown): BrowserStoredNote | null {
  if (typeof value !== 'object' || value === null) return null

  const obj = value as Record<string, unknown>

  return {
    document:
      typeof obj.document === 'string'
        ? obj.document
        : String(obj.document ?? ''),
    createdAt:
      typeof obj.createdAt === 'string'
        ? obj.createdAt
        : String(obj.createdAt ?? ''),
    modifiedAt:
      typeof obj.modifiedAt === 'string'
        ? obj.modifiedAt
        : String(obj.modifiedAt ?? ''),
  }
}

function getLocalStorage(): Storage {
  if (typeof localStorage === 'undefined') {
    throw new Error('Browser storage is only available in the browser')
  }

  return localStorage
}

function parseStoredNotes(raw: string | null): BrowserStoredNotes {
  if (!raw) return {}

  try {
    const parsed: unknown = JSON.parse(raw)

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, value]) => [key, coerceBrowserStoredNote(value)])
        .filter(
          (entry): entry is [string, BrowserStoredNote] => entry[1] !== null,
        ),
    )
  } catch {
    return {}
  }
}

function composeNote(id: string, storedNote: BrowserStoredNote): Note {
  const { properties, content } = parseDocument(storedNote.document)

  return {
    id,
    ...properties,
    content,
    createdAt: storedNote.createdAt,
    modifiedAt: storedNote.modifiedAt,
  }
}

function readStoredNotes(): BrowserStoredNotes {
  return parseStoredNotes(getLocalStorage().getItem(STORAGE_KEY))
}

function writeStoredNotes(notes: BrowserStoredNotes): void {
  const storage = getLocalStorage()

  if (Object.keys(notes).length === 0) {
    storage.removeItem(STORAGE_KEY)
    return
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export const browserStorage: NoteStorage = {
  async loadNotes(): Promise<Note[]> {
    const notes = Object.entries(readStoredNotes()).map(([id, storedNote]) =>
      composeNote(id, storedNote),
    )

    return notes.sort(
      (a, b) =>
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
    )
  },

  async saveNote(input: SaveNoteInput): Promise<Note> {
    const notes = readStoredNotes()
    const existingNote = notes[input.id]
    const timestamp = new Date().toISOString()
    const storedNote: BrowserStoredNote = {
      document: serializeDocument(input.properties, input.content),
      createdAt: existingNote?.createdAt ?? timestamp,
      modifiedAt: timestamp,
    }

    notes[input.id] = storedNote

    writeStoredNotes(notes)

    return composeNote(input.id, storedNote)
  },

  async deleteNote(id: string): Promise<void> {
    const notes = readStoredNotes()

    if (!notes[id]) {
      return
    }

    const { [id]: _, ...remaining } = notes

    writeStoredNotes(remaining)
  },
}
