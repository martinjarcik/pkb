import { createNoteCatalogRow } from '~/notes/catalogRow'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import { moveNoteId, resolveUniqueNoteId } from '~/notes/noteId'
import { noteTitleFromId } from '~/notes/noteTitleFromId'
import {
  catalogRowIsTrashed,
  trashExpired,
  withoutTrashedAt,
} from '~/notes/trash'
import type { Note, NoteCatalogRow } from '~/notes/types'
import type {
  MoveNoteInput,
  NoteStorage,
  RenameNoteTitleInput,
  SaveNoteInput,
} from './types'
import {
  parseDocument,
  sanitizeProperties,
  serializeDocument,
} from './document'

const LEGACY_STORAGE_KEY = 'notes'
const NOTE_INDEX_STORAGE_KEY = 'note-index'
const NOTE_STORAGE_KEY_PREFIX = 'note:'
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

function noteStorageKey(id: string): string {
  return `${NOTE_STORAGE_KEY_PREFIX}${id}`
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

function parseStoredNoteIds(raw: string | null): string[] {
  if (!raw) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
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

function writeStoredNoteIds(ids: string[]): void {
  const storage = getLocalStorage()

  if (ids.length === 0) {
    storage.removeItem(NOTE_INDEX_STORAGE_KEY)
    return
  }

  storage.setItem(NOTE_INDEX_STORAGE_KEY, JSON.stringify(ids))
}

function writeStoredNote(id: string, storedNote: BrowserStoredNote): void {
  getLocalStorage().setItem(noteStorageKey(id), JSON.stringify(storedNote))
}

function readStoredNote(id: string): BrowserStoredNote | null {
  migrateLegacyStoredNotes()
  const raw = getLocalStorage().getItem(noteStorageKey(id))

  if (!raw) {
    return null
  }

  try {
    return coerceBrowserStoredNote(JSON.parse(raw))
  } catch {
    return null
  }
}

function removeStoredNote(id: string): void {
  getLocalStorage().removeItem(noteStorageKey(id))
}

function migrateLegacyStoredNotes(): void {
  const storage = getLocalStorage()

  if (storage.getItem(NOTE_INDEX_STORAGE_KEY)) {
    return
  }

  const legacyNotes = parseStoredNotes(storage.getItem(LEGACY_STORAGE_KEY))
  const ids = Object.keys(legacyNotes)

  if (ids.length === 0) {
    storage.removeItem(LEGACY_STORAGE_KEY)
    return
  }

  for (const id of ids) {
    writeStoredNote(id, legacyNotes[id]!)
  }

  writeStoredNoteIds(ids)
  storage.removeItem(LEGACY_STORAGE_KEY)
}

function readStoredNoteIds(): string[] {
  migrateLegacyStoredNotes()

  return parseStoredNoteIds(getLocalStorage().getItem(NOTE_INDEX_STORAGE_KEY))
}

function readStoredNotes(): BrowserStoredNotes {
  const ids = readStoredNoteIds()
  const notes: BrowserStoredNotes = {}
  const validIds: string[] = []

  for (const id of ids) {
    const storedNote = readStoredNote(id)

    if (!storedNote) {
      continue
    }

    notes[id] = storedNote
    validIds.push(id)
  }

  if (validIds.length !== ids.length) {
    writeStoredNoteIds(validIds)
  }

  return notes
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

export const browserStorage: NoteStorage = {
  async loadNotesCatalog(): Promise<NoteCatalogRow[]> {
    const notes = Object.entries(readStoredNotes()).map(([id, storedNote]) =>
      composeNoteCatalogRow(id, storedNote),
    )

    return notes.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
  },

  async loadFolders(): Promise<string[]> {
    return readStoredFolders().sort((left, right) => left.localeCompare(right))
  },

  async loadNoteById(id: string): Promise<Note | null> {
    const storedNote = readStoredNote(id)

    if (!storedNote) {
      return null
    }

    return composeNote(id, storedNote)
  },

  async saveNote(input: SaveNoteInput): Promise<Note> {
    const ids = readStoredNoteIds()
    const existingNote = readStoredNote(input.id)
    const timestamp = new Date().toISOString()
    const storedNote: BrowserStoredNote = {
      document: serializeDocument(input.properties, input.content),
      createdAt: existingNote?.createdAt ?? timestamp,
      modifiedAt: timestamp,
    }

    writeStoredNote(input.id, storedNote)

    if (!ids.includes(input.id)) {
      writeStoredNoteIds([...ids, input.id])
    }

    return composeNote(input.id, storedNote)
  },

  async renameNoteTitle(input: RenameNoteTitleInput): Promise<Note> {
    const ids = readStoredNoteIds()
    const storedNote = readStoredNote(input.id)

    if (!storedNote) {
      throw new Error(`Note not found: ${input.id}`)
    }

    const nextId = resolveUniqueNoteId(
      input.id,
      input.title,
      input.existingIds ?? ids,
    )

    if (nextId !== input.id) {
      writeStoredNote(nextId, storedNote)
      removeStoredNote(input.id)
      writeStoredNoteIds(ids.map((id) => (id === input.id ? nextId : id)))
    }

    return composeNote(nextId, storedNote)
  },

  async moveNote(input: MoveNoteInput): Promise<Note> {
    const ids = readStoredNoteIds()
    const storedNote = readStoredNote(input.id)

    if (!storedNote) {
      throw new Error(`Note not found: ${input.id}`)
    }

    const nextId = moveNoteId(
      input.id,
      input.targetParentPath,
      input.existingIds ?? ids,
    )

    const parsedMove = parseDocument(storedNote.document)
    const content = parsedMove.content
    let properties = parsedMove.properties
    const hadTrashed =
      typeof properties.trashedAt === 'string' &&
      properties.trashedAt.length > 0

    if (hadTrashed) {
      properties = withoutTrashedAt(properties)
    }

    const document = hadTrashed
      ? serializeDocument(sanitizeProperties(properties), content)
      : storedNote.document

    const nextStored: BrowserStoredNote = hadTrashed
      ? {
          document,
          createdAt: storedNote.createdAt,
          modifiedAt: new Date().toISOString(),
        }
      : {
          document: storedNote.document,
          createdAt: storedNote.createdAt,
          modifiedAt: storedNote.modifiedAt,
        }

    if (nextId !== input.id) {
      writeStoredNote(nextId, nextStored)
      removeStoredNote(input.id)
      writeStoredNoteIds(ids.map((id) => (id === input.id ? nextId : id)))
    } else if (hadTrashed) {
      writeStoredNote(input.id, nextStored)
    }

    const effectiveStored =
      nextId !== input.id || hadTrashed ? nextStored : storedNote

    return composeNote(nextId, effectiveStored)
  },

  async softDeleteNote(id: string): Promise<Note> {
    const note = await this.loadNoteById(id)

    if (!note) {
      throw new Error(`Note not found: ${id}`)
    }

    const properties = sanitizeProperties(note)

    return this.saveNote({
      id: note.id,
      properties: {
        ...properties,
        trashedAt: new Date().toISOString(),
      },
      content: note.content,
    })
  },

  async purgeExpiredTrashedNotes(
    retentionDays: number,
    now: Date = new Date(),
  ): Promise<void> {
    const catalog = await this.loadNotesCatalog()
    const idsToDelete = catalog
      .filter(
        (row) =>
          catalogRowIsTrashed(row) &&
          typeof row.trashedAt === 'string' &&
          trashExpired(row.trashedAt, retentionDays, now),
      )
      .map((row) => row.id)

    await Promise.all(idsToDelete.map(async (id) => this.deleteNote(id)))
  },

  async deleteNote(id: string): Promise<void> {
    const ids = readStoredNoteIds()

    if (!ids.includes(id)) {
      return
    }

    removeStoredNote(id)
    writeStoredNoteIds(ids.filter((existingId) => existingId !== id))
  },

  async createFolder(name: string): Promise<void> {
    const stored = readStoredFolders()

    if (!stored.includes(name)) {
      writeStoredFolders([...stored, name])
    }
  },

  async renameFolder(oldName: string, newName: string): Promise<void> {
    const stored = readStoredFolders()
    const updated = stored.map((f) => (f === oldName ? newName : f))

    writeStoredFolders(updated)

    const notes = readStoredNotes()
    const prefix = `${oldName}/`
    const rekeyedIds: string[] = []

    for (const [id, note] of Object.entries(notes)) {
      const key = id.startsWith(prefix)
        ? `${newName}/${id.slice(prefix.length)}`
        : id

      writeStoredNote(key, note)
      rekeyedIds.push(key)

      if (key !== id) {
        removeStoredNote(id)
      }
    }

    writeStoredNoteIds(rekeyedIds)
  },
}
