import {
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from 'fs/promises'
import { dirname, relative, resolve } from 'path'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import { noteTitleFromId } from '~/notes/noteTitleFromId'
import type { Note, NoteProperties } from '~/notes/types'
import { moveNoteId, resolveUniqueNoteId } from '~/notes/noteId'
import { withoutTrashedAt } from '~/notes/trash'
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

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true })

  return entries
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => resolve(dir, entry))
}

function assertSafeId(vaultPath: string, id: string): string {
  const filePath = resolve(vaultPath, id)
  const normalizedVault = resolve(vaultPath)

  if (!filePath.startsWith(normalizedVault + '/')) {
    throw new Error(`Note ID resolves outside the vault: ${id}`)
  }

  return filePath
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false
    }

    throw error
  }
}

async function loadExistingIds(normalizedVault: string): Promise<string[]> {
  const filePaths = await findMarkdownFiles(normalizedVault)

  return filePaths.map((filePath) => relative(normalizedVault, filePath))
}

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

async function loadNoteFromDisk(
  vaultPath: string,
  id: string,
): Promise<Note | null> {
  const filePath = assertSafeId(vaultPath, id)

  try {
    const raw = await readFile(filePath, 'utf-8')
    const fileStats = await stat(filePath)
    const { properties, content } = parseDocument(raw)

    return composeNote(
      id,
      properties,
      content,
      fileStats.birthtime.toISOString(),
      fileStats.mtime.toISOString(),
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }

    throw error
  }
}

export function createFilesystemStorage(vaultPath: string): NoteStorage {
  return {
    async loadAllNotes(): Promise<Note[]> {
      const normalizedVault = resolve(vaultPath)
      const filePaths = await findMarkdownFiles(normalizedVault)

      const notes = await Promise.all(
        filePaths.map(async (filePath) => {
          const fileStats = await stat(filePath)
          const raw = await readFile(filePath, 'utf-8')
          const { properties, content } = parseDocument(raw)
          const id = relative(normalizedVault, filePath)

          return composeNote(
            id,
            properties,
            content,
            fileStats.birthtime.toISOString(),
            fileStats.mtime.toISOString(),
          )
        }),
      )

      return notes.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
    },

    async loadExplicitFolders(): Promise<string[]> {
      const normalizedVault = resolve(vaultPath)
      const entries = await readdir(normalizedVault, { withFileTypes: true })

      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right))
    },

    async saveNote(input: SaveNoteInput): Promise<Note> {
      const filePath = assertSafeId(vaultPath, input.id)
      const document = serializeDocument(input.properties, input.content)

      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, document, 'utf-8')

      const fileStats = await stat(filePath)

      return composeNote(
        input.id,
        sanitizeProperties(input.properties),
        input.content,
        fileStats.birthtime.toISOString(),
        fileStats.mtime.toISOString(),
      )
    },

    async renameNoteTitle(input: RenameNoteTitleInput): Promise<Note> {
      const normalizedVault = resolve(vaultPath)
      const currentPath = assertSafeId(vaultPath, input.id)
      let nextId = resolveUniqueNoteId(
        input.id,
        input.title,
        input.existingIds ?? (await loadExistingIds(normalizedVault)),
      )
      const raw = await readFile(currentPath, 'utf-8')

      if (nextId !== input.id) {
        const nextPath = assertSafeId(vaultPath, nextId)

        if (await fileExists(nextPath)) {
          nextId = resolveUniqueNoteId(
            input.id,
            input.title,
            await loadExistingIds(normalizedVault),
          )
        }
      }

      if (nextId !== input.id) {
        const nextPath = assertSafeId(vaultPath, nextId)

        await rename(currentPath, nextPath)
      }

      const fileStats = await stat(assertSafeId(vaultPath, nextId))
      const { properties, content } = parseDocument(raw)

      return composeNote(
        nextId,
        properties,
        content,
        fileStats.birthtime.toISOString(),
        fileStats.mtime.toISOString(),
      )
    },

    async moveNote(input: MoveNoteInput): Promise<Note> {
      const normalizedVault = resolve(vaultPath)
      const currentPath = assertSafeId(vaultPath, input.id)
      let nextId = moveNoteId(
        input.id,
        input.targetParentPath,
        input.existingIds ?? (await loadExistingIds(normalizedVault)),
      )
      const raw = await readFile(currentPath, 'utf-8')
      const parsed = parseDocument(raw)
      const content = parsed.content
      let properties = parsed.properties

      if (nextId !== input.id) {
        const nextPath = assertSafeId(vaultPath, nextId)

        if (await fileExists(nextPath)) {
          nextId = moveNoteId(
            input.id,
            input.targetParentPath,
            await loadExistingIds(normalizedVault),
          )
        }
      }

      if (nextId !== input.id) {
        const nextPath = assertSafeId(vaultPath, nextId)

        await mkdir(dirname(nextPath), { recursive: true })
        await rename(currentPath, nextPath)
      }

      const finalPath = assertSafeId(vaultPath, nextId)
      const hadTrashed =
        typeof properties.trashedAt === 'string' &&
        properties.trashedAt.length > 0

      if (hadTrashed) {
        properties = withoutTrashedAt(properties)
        await writeFile(
          finalPath,
          serializeDocument(sanitizeProperties(properties), content),
          'utf-8',
        )
      }

      const fileStats = await stat(finalPath)

      return composeNote(
        nextId,
        sanitizeProperties(properties),
        content,
        fileStats.birthtime.toISOString(),
        fileStats.mtime.toISOString(),
      )
    },

    async softDeleteNote(id: string): Promise<Note> {
      const note = await loadNoteFromDisk(vaultPath, id)

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

    async deleteNote(id: string): Promise<void> {
      const filePath = assertSafeId(vaultPath, id)

      try {
        await unlink(filePath)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
    },

    async createFolder(name: string): Promise<void> {
      const folderPath = assertSafeId(vaultPath, name)

      await mkdir(folderPath, { recursive: true })
    },

    async renameFolder(oldName: string, newName: string): Promise<void> {
      const oldPath = assertSafeId(vaultPath, oldName)
      const newPath = assertSafeId(vaultPath, newName)

      await rename(oldPath, newPath)
    },
  }
}
