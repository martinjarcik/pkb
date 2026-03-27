import { createNoteCatalogRow } from '~/notes/catalogRow'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import { moveNoteId, resolveUniqueNoteId } from '~/notes/renameNoteTitle'
import { noteTitleFromId } from '~/notes/noteTitleFromId'
import type { Note, NoteCatalogRow } from '~/notes/types'
import type {
  MoveNoteInput,
  NoteStorage,
  RenameNoteTitleInput,
  SaveNoteInput,
} from './types'
import { parseDocument, serializeDocument } from './document'

const STORAGE_KEY = 'notes'
const FOLDERS_STORAGE_KEY = 'folders'

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
    title: noteTitleFromId(id),
    description: noteDescriptionFromContent(content),
  }
}

function composeNoteCatalogRow(
  id: string,
  storedNote: BrowserStoredNote,
): NoteCatalogRow {
  return createNoteCatalogRow(composeNote(id, storedNote))
}

function readStoredNotes(): BrowserStoredNotes {
  return parseStoredNotes(getLocalStorage().getItem(STORAGE_KEY))
}

function readStoredFolders(): string[] {
  const raw = getLocalStorage().getItem(FOLDERS_STORAGE_KEY)

  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

function writeStoredFolders(folders: string[]): void {
  const storage = getLocalStorage()

  if (folders.length === 0) {
    storage.removeItem(FOLDERS_STORAGE_KEY)
    return
  }

  storage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders))
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
  async loadNotesCatalog(): Promise<NoteCatalogRow[]> {
    const notes = Object.entries(readStoredNotes()).map(([id, storedNote]) =>
      composeNoteCatalogRow(id, storedNote),
    )

    return notes.sort(
      (a, b) =>
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
    )
  },

  async loadFolders(): Promise<string[]> {
    return readStoredFolders().sort((left, right) => left.localeCompare(right))
  },

  async loadNoteById(id: string): Promise<Note | null> {
    const storedNote = readStoredNotes()[id]

    if (!storedNote) {
      return null
    }

    return composeNote(id, storedNote)
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

  async renameNoteTitle(input: RenameNoteTitleInput): Promise<Note> {
    const notes = readStoredNotes()
    const storedNote = notes[input.id]

    if (!storedNote) {
      throw new Error(`Note not found: ${input.id}`)
    }

    const nextId = resolveUniqueNoteId(
      input.id,
      input.title,
      Object.keys(notes),
    )

    if (nextId !== input.id) {
      const { [input.id]: _removed, ...remaining } = notes

      writeStoredNotes({
        ...remaining,
        [nextId]: storedNote,
      })
    }

    return composeNote(nextId, storedNote)
  },

  async moveNote(input: MoveNoteInput): Promise<Note> {
    const notes = readStoredNotes()
    const storedNote = notes[input.id]

    if (!storedNote) {
      throw new Error(`Note not found: ${input.id}`)
    }

    const nextId = moveNoteId(
      input.id,
      input.targetParentPath,
      Object.keys(notes),
    )

    if (nextId !== input.id) {
      const { [input.id]: _removed, ...remaining } = notes

      writeStoredNotes({
        ...remaining,
        [nextId]: storedNote,
      })
    }

    return composeNote(nextId, storedNote)
  },

  async deleteNote(id: string): Promise<void> {
    const notes = readStoredNotes()

    if (!notes[id]) {
      return
    }

    const { [id]: _, ...remaining } = notes

    writeStoredNotes(remaining)
  },

  async createFolder(name: string): Promise<void> {
    const stored = readStoredFolders()

    if (!stored.includes(name)) {
      writeStoredFolders([...stored, name])
    }
  },
}
