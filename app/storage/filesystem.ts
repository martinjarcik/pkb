import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises'
import { dirname, relative, resolve } from 'path'
import yaml from 'yaml'
import type { Note, NoteProperties, NotePropertyValue } from '~/notes/types'
import { NOTE_SYSTEM_PROPERTY_KEYS } from '~/notes/types'
import type { NoteStorage, SaveNoteInput } from './types'

const NOTE_SYSTEM_PROPERTY_KEY_SET = new Set<string>(NOTE_SYSTEM_PROPERTY_KEYS)
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
  const sanitized = sanitizeProperties(properties)

  if (Object.keys(sanitized).length === 0) {
    return content
  }

  const frontmatter = yaml.stringify(sanitized).trimEnd()

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

    return { properties: sanitizeProperties(parsed), content }
  } catch {
    return { properties: {}, content }
  }
}

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

      return {
        id: input.id,
        ...sanitizeProperties(input.properties),
        content: input.content,
        createdAt: '',
        modifiedAt: '',
      }
    },

    async deleteNote(): Promise<void> {},
  }
}
