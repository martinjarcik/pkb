import yaml from 'yaml'
import type { Note, NoteProperties, NotePropertyValue } from '~/notes/types'
import { NOTE_SYSTEM_PROPERTY_KEYS } from '~/notes/types'
import type { NoteStorage, SaveNoteInput } from './types'

const STORAGE_KEY = 'notes'
const NOTE_SYSTEM_PROPERTY_KEY_SET = new Set<string>(NOTE_SYSTEM_PROPERTY_KEYS)

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

const MAX_PROPERTY_DEPTH = 10

function coercePropertyValue(
  value: unknown,
  depth: number = 0,
): NotePropertyValue {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value
  if (depth >= MAX_PROPERTY_DEPTH) return String(value)
  if (value instanceof Date) return value.toISOString()

  if (Array.isArray(value)) {
    return value.map((item) => coercePropertyValue(item, depth + 1))
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        coercePropertyValue(val, depth + 1),
      ]),
    )
  }

  return String(value)
}

function sanitizeProperties(value: unknown): NoteProperties {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !NOTE_SYSTEM_PROPERTY_KEY_SET.has(key))
      .map(([key, val]) => [key, coercePropertyValue(val)]),
  ) as NoteProperties
}

function serializeDocument(
  properties: NoteProperties,
  content: string,
): string {
  const sanitizedProperties = sanitizeProperties(properties)

  if (Object.keys(sanitizedProperties).length === 0) {
    return content
  }

  const frontmatter = yaml.stringify(sanitizedProperties).trimEnd()

  return `---\n${frontmatter}\n---\n${content}`
}

function parseDocument(raw: string): {
  properties: NoteProperties
  content: string
} {
  const document = raw.replace(/\r\n?/g, '\n')

  if (!document.startsWith('---\n')) {
    return { properties: {}, content: document }
  }

  const closingIndex = document.indexOf('\n---\n', 4)

  if (closingIndex === -1) {
    return { properties: {}, content: document }
  }

  const content = document.slice(closingIndex + 5)

  try {
    const rawFrontmatter = document.slice(4, closingIndex)
    const parsed = yaml.parse(rawFrontmatter)

    return {
      properties: sanitizeProperties(parsed),
      content,
    }
  } catch {
    return { properties: {}, content }
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
