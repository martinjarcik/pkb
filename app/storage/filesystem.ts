import {
  mkdir,
  open,
  readdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from 'fs/promises'
import { dirname, relative, resolve } from 'path'
import { createNoteCatalogRow } from '~/notes/catalogRow'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import { noteTitleFromId } from '~/notes/noteTitleFromId'
import {
  NOTE_CATALOG_CONTENT_BYTES,
  type Note,
  type NoteCatalogRow,
  type NoteProperties,
} from '~/notes/types'
import { moveNoteId, resolveUniqueNoteId } from '~/notes/renameNoteTitle'
import {
  catalogRowIsTrashed,
  trashExpired,
  withoutTrashedAt,
} from '~/notes/trash'
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
  truncateUtf8ByteLength,
} from './document'

const NOTE_FILE_READ_CHUNK_BYTES = 2048

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const paths: string[] = []

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name)

    if (entry.isDirectory()) {
      paths.push(...(await findMarkdownFiles(fullPath)))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      paths.push(fullPath)
    }
  }

  return paths
}

function assertSafeId(vaultPath: string, id: string): string {
  const filePath = resolve(vaultPath, id)
  const normalizedVault = resolve(vaultPath)

  if (!filePath.startsWith(normalizedVault + '/')) {
    throw new Error(`Note ID resolves outside the vault: ${id}`)
  }

  return filePath
}

function hasUnclosedFrontmatter(raw: string): boolean {
  const document = raw.replace(/\r\n?/g, '\n')

  return document.startsWith('---\n') && document.indexOf('\n---\n', 4) === -1
}

function hasPreviewBytes(content: string): boolean {
  return new TextEncoder().encode(content).length >= NOTE_CATALOG_CONTENT_BYTES
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

async function readCatalogContent(filePath: string): Promise<{
  properties: NoteProperties
  content: string
}> {
  const fileHandle = await open(filePath, 'r')
  const chunks: Buffer[] = []

  try {
    while (true) {
      const chunk = Buffer.alloc(NOTE_FILE_READ_CHUNK_BYTES)
      const { bytesRead } = await fileHandle.read(chunk, 0, chunk.length, null)

      if (bytesRead === 0) {
        const parsed = parseDocument(Buffer.concat(chunks).toString('utf-8'))

        return {
          properties: parsed.properties,
          content: truncateUtf8ByteLength(
            parsed.content,
            NOTE_CATALOG_CONTENT_BYTES,
          ),
        }
      }

      chunks.push(chunk.subarray(0, bytesRead))

      const raw = Buffer.concat(chunks).toString('utf-8')

      if (hasUnclosedFrontmatter(raw)) {
        continue
      }

      const parsed = parseDocument(raw)

      if (hasPreviewBytes(parsed.content)) {
        return {
          properties: parsed.properties,
          content: truncateUtf8ByteLength(
            parsed.content,
            NOTE_CATALOG_CONTENT_BYTES,
          ),
        }
      }
    }
  } finally {
    await fileHandle.close()
  }
}

export function createFilesystemStorage(vaultPath: string): NoteStorage {
  return {
    async loadNotesCatalog(): Promise<NoteCatalogRow[]> {
      const normalizedVault = resolve(vaultPath)
      const filePaths = await findMarkdownFiles(normalizedVault)

      const notes = await Promise.all(
        filePaths.map(async (filePath) => {
          const fileStats = await stat(filePath)
          const { properties, content } = await readCatalogContent(filePath)
          const id = relative(normalizedVault, filePath)

          return createNoteCatalogRow(
            composeNote(
              id,
              properties,
              content,
              fileStats.birthtime.toISOString(),
              fileStats.mtime.toISOString(),
            ),
          )
        }),
      )

      return notes.sort(
        (a, b) =>
          new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
      )
    },

    async loadFolders(): Promise<string[]> {
      const normalizedVault = resolve(vaultPath)
      const entries = await readdir(normalizedVault, { withFileTypes: true })

      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right))
    },

    async loadNoteById(id: string): Promise<Note | null> {
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
      const existingFilePaths = await findMarkdownFiles(normalizedVault)
      const existingIds = existingFilePaths.map((filePath) =>
        relative(normalizedVault, filePath),
      )
      const nextId = resolveUniqueNoteId(input.id, input.title, existingIds)
      const raw = await readFile(currentPath, 'utf-8')

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
      const existingFilePaths = await findMarkdownFiles(normalizedVault)
      const existingIds = existingFilePaths.map((filePath) =>
        relative(normalizedVault, filePath),
      )
      const nextId = moveNoteId(input.id, input.targetParentPath, existingIds)
      const raw = await readFile(currentPath, 'utf-8')
      const parsed = parseDocument(raw)
      const content = parsed.content
      let properties = parsed.properties

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

      for (const id of idsToDelete) {
        await this.deleteNote(id)
      }
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
