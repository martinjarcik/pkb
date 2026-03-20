import { readFile, writeFile, mkdtemp, rm, utimes, stat } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFilesystemStorage } from '~/storage/filesystem'
import type { NoteStorage } from '~/storage/types'

describe('filesystemStorage', () => {
  let vaultPath: string
  let storage: NoteStorage

  beforeEach(async () => {
    vaultPath = await mkdtemp(join(tmpdir(), 'pkb-test-'))
    storage = createFilesystemStorage(vaultPath)
  })

  afterEach(async () => {
    await rm(vaultPath, { recursive: true, force: true })
  })

  it('saves a note as a markdown file with yaml frontmatter', async () => {
    await storage.saveNote({
      id: 'welcome.md',
      properties: { title: 'Welcome', published: true },
      content: '# Hello',
    })

    const written = await readFile(join(vaultPath, 'welcome.md'), 'utf-8')

    expect(written).toBe('---\ntitle: Welcome\npublished: true\n---\n# Hello')
  })

  it('loads notes with correct properties and timestamps', async () => {
    const filePath = join(vaultPath, 'hello.md')

    await writeFile(
      filePath,
      '---\ntitle: Hello\npublished: true\n---\n# Content',
      'utf-8',
    )

    const mtime = new Date('2026-03-20T12:00:00.000Z')
    await utimes(filePath, mtime, mtime)

    const fileStats = await stat(filePath)
    const notes = await storage.loadNotes()

    expect(notes).toHaveLength(1)
    expect(notes[0]).toEqual({
      id: 'hello.md',
      title: 'Hello',
      published: true,
      content: '# Content',
      createdAt: fileStats.birthtime.toISOString(),
      modifiedAt: '2026-03-20T12:00:00.000Z',
    })
  })

  it('returns loaded notes ordered by most recently modified first', async () => {
    const older = join(vaultPath, 'older.md')
    const newer = join(vaultPath, 'newer.md')

    await writeFile(older, '# Older', 'utf-8')
    await utimes(
      older,
      new Date('2026-03-18T00:00:00Z'),
      new Date('2026-03-18T00:00:00Z'),
    )

    await writeFile(newer, '# Newer', 'utf-8')
    await utimes(
      newer,
      new Date('2026-03-20T00:00:00Z'),
      new Date('2026-03-20T00:00:00Z'),
    )

    const notes = await storage.loadNotes()

    expect(notes.map((n) => n.id)).toEqual(['newer.md', 'older.md'])
  })
})
