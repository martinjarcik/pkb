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
import type { Note } from '~/notes/types'
import { resolveUniqueNoteId } from '~/notes/renameNoteTitle'
import type { NoteStorage, RenameNoteTitleInput, SaveNoteInput } from './types'
import {
  parseDocument,
  sanitizeProperties,
  serializeDocument,
} from './document'

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

export function createFilesystemStorage(vaultPath: string): NoteStorage {
  return {
    async loadNotes(): Promise<Note[]> {
      const normalizedVault = resolve(vaultPath)
      const filePaths = await findMarkdownFiles(normalizedVault)

      const notes = await Promise.all(
        filePaths.map(async (filePath) => {
          const raw = await readFile(filePath, 'utf-8')
          const fileStats = await stat(filePath)
          const { properties, content } = parseDocument(raw)
          const id = relative(normalizedVault, filePath)

          return {
            id,
            ...properties,
            content,
            createdAt: fileStats.birthtime.toISOString(),
            modifiedAt: fileStats.mtime.toISOString(),
          } satisfies Note
        }),
      )

      return notes.sort(
        (a, b) =>
          new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
      )
    },

    async saveNote(input: SaveNoteInput): Promise<Note> {
      const filePath = assertSafeId(vaultPath, input.id)
      const document = serializeDocument(input.properties, input.content)

      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, document, 'utf-8')

      const fileStats = await stat(filePath)

      return {
        id: input.id,
        ...sanitizeProperties(input.properties),
        content: input.content,
        createdAt: fileStats.birthtime.toISOString(),
        modifiedAt: fileStats.mtime.toISOString(),
      }
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

      return {
        id: nextId,
        ...properties,
        content,
        createdAt: fileStats.birthtime.toISOString(),
        modifiedAt: fileStats.mtime.toISOString(),
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
  }
}
