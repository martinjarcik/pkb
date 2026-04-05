import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import { moveNoteId, resolveUniqueNoteId } from '~/notes/noteId'
import { noteTitleFromId } from '~/notes/noteTitleFromId'
import { catalogRowIsTrashed, withoutTrashedAt } from '~/notes/trash'
import type { Note, NoteProperties } from '~/notes/types'
import type {
  MoveNoteInput,
  NoteStorage,
  RenameNoteTitleInput,
  SaveNoteInput,
} from './types'
import type { PlatformApi } from './platformApi'
import {
  parseDocument,
  sanitizeProperties,
  serializeDocument,
} from './document'

function composeNote(
  id: string,
  properties: NoteProperties,
  content: string,
  createdAt: string,
  modifiedAt: string,
): Note {
  return {
    id,
    ...properties,
    content,
    createdAt,
    modifiedAt,
    title: noteTitleFromId(id),
    description: noteDescriptionFromContent(content),
  }
}

function composeNoteFromRaw(
  id: string,
  rawContent: string,
  birthtime: string,
  mtime: string,
): Note {
  const { properties, content } = parseDocument(rawContent)

  return composeNote(id, properties, content, birthtime, mtime)
}

export function createFilesystemProxyStorage(
  platformApi: PlatformApi,
  vaultPath: string,
): NoteStorage {
  async function loadExistingNoteIds(): Promise<string[]> {
    const allNotes = await platformApi.readAllNotes(vaultPath)
    return allNotes.map((entry) => entry.path)
  }

  async function loadNoteFromInput(id: string, note?: Note): Promise<Note> {
    if (note) {
      return note
    }

    const allNotes = await platformApi.readAllNotes(vaultPath)
    const rawNote = allNotes.find((entry) => entry.path === id)

    if (!rawNote) {
      throw new Error(`Note not found: ${id}`)
    }

    return composeNoteFromRaw(
      rawNote.path,
      rawNote.content,
      rawNote.birthtime,
      rawNote.mtime,
    )
  }

  return {
    async loadAllNotes(): Promise<Note[]> {
      const files = await platformApi.readAllNotes(vaultPath)

      return files
        .map((file) =>
          composeNoteFromRaw(
            file.path,
            file.content,
            file.birthtime,
            file.mtime,
          ),
        )
        .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
    },

    async saveNote(input: SaveNoteInput): Promise<Note> {
      const saved = await platformApi.writeTextFile(
        vaultPath,
        input.id,
        serializeDocument(input.properties, input.content),
      )

      return composeNote(
        input.id,
        sanitizeProperties(input.properties),
        input.content,
        saved.birthtime,
        saved.mtime,
      )
    },

    async renameNoteTitle(input: RenameNoteTitleInput): Promise<Note> {
      const note = await loadNoteFromInput(input.id, input.note)

      const nextId = resolveUniqueNoteId(
        input.id,
        input.title,
        input.existingIds ?? (await loadExistingNoteIds()),
      )

      if (nextId !== input.id) {
        await platformApi.renameTextFile(vaultPath, input.id, nextId)
      }

      return {
        ...note,
        id: nextId,
        title: noteTitleFromId(nextId),
      }
    },

    async moveNote(input: MoveNoteInput): Promise<Note> {
      const note = await loadNoteFromInput(input.id, input.note)

      const nextId = moveNoteId(
        input.id,
        input.targetParentPath,
        input.existingIds ?? (await loadExistingNoteIds()),
      )

      if (nextId !== input.id) {
        await platformApi.renameTextFile(vaultPath, input.id, nextId)
      }

      if (catalogRowIsTrashed(note)) {
        const nextProperties = withoutTrashedAt(note)
        const saved = await platformApi.writeTextFile(
          vaultPath,
          nextId,
          serializeDocument(sanitizeProperties(nextProperties), note.content),
        )

        return composeNote(
          nextId,
          sanitizeProperties(nextProperties),
          note.content,
          saved.birthtime,
          saved.mtime,
        )
      }

      return {
        ...note,
        id: nextId,
        title: noteTitleFromId(nextId),
      }
    },

    async softDeleteNote(id: string, note?: Note): Promise<Note> {
      const noteToDelete = await loadNoteFromInput(id, note)

      return this.saveNote({
        id,
        properties: {
          ...sanitizeProperties(noteToDelete),
          trashedAt: new Date().toISOString(),
        },
        content: noteToDelete.content,
      })
    },

    async deleteNote(id: string): Promise<void> {
      await platformApi.deleteTextFile(vaultPath, id)
    },

    async createFolder(name: string): Promise<void> {
      await platformApi.createDirectory(vaultPath, name)
    },

    async renameFolder(oldName: string, newName: string): Promise<void> {
      await platformApi.renameDirectory(vaultPath, oldName, newName)
    },
  }
}
