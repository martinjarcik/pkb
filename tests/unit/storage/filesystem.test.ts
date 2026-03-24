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

  it('preserves frontmatter properties across save and load', async () => {
    await storage.saveNote({
      id: 'round-trip.md',
      properties: {
        title: 'Round Trip',
        views: 3,
        meta: { nested: true },
        tags: ['a', 'b'],
      },
      content: '# Body',
    })

    const notes = await storage.loadNotes()

    expect(notes).toHaveLength(1)
    expect(notes[0]!.title).toBe('Round Trip')
    expect(notes[0]!.views).toBe(3)
    expect(notes[0]!.meta).toEqual({ nested: true })
    expect(notes[0]!.tags).toEqual(['a', 'b'])
    expect(notes[0]!.content).toBe('# Body')
  })

  it('creates intermediate directories when saving a nested note', async () => {
    await storage.saveNote({
      id: 'sub/deep/note.md',
      properties: { title: 'Deep' },
      content: '# Nested',
    })

    const written = await readFile(
      join(vaultPath, 'sub', 'deep', 'note.md'),
      'utf-8',
    )

    expect(written).toBe('---\ntitle: Deep\n---\n# Nested')
  })

  it('stores raw content without frontmatter when properties are empty', async () => {
    await storage.saveNote({
      id: 'plain.md',
      properties: {},
      content: '# Just content',
    })

    const written = await readFile(join(vaultPath, 'plain.md'), 'utf-8')

    expect(written).toBe('# Just content')
  })

  it('deletes a note file by id', async () => {
    await storage.saveNote({
      id: 'to-delete.md',
      properties: { title: 'Delete Me' },
      content: '# Gone',
    })

    await storage.deleteNote('to-delete.md')

    const notes = await storage.loadNotes()

    expect(notes).toHaveLength(0)
  })

  it('returns an empty array when the vault is empty', async () => {
    const notes = await storage.loadNotes()

    expect(notes).toEqual([])
  })

  it('isolates content from broken frontmatter', async () => {
    await writeFile(
      join(vaultPath, 'broken.md'),
      '---\ntitle: [invalid yaml\n---\n# Still readable',
      'utf-8',
    )

    const notes = await storage.loadNotes()

    expect(notes).toHaveLength(1)
    expect(notes[0]!.content).toBe('# Still readable')
    expect(notes[0]!.title).toBeUndefined()
  })

  it('does not throw when deleting a non-existent note', async () => {
    await expect(storage.deleteNote('missing.md')).resolves.toBeUndefined()
  })

  it('rejects saving with a path-traversal note ID', async () => {
    await expect(
      storage.saveNote({
        id: '../outside.md',
        properties: {},
        content: 'escaped',
      }),
    ).rejects.toThrow('Note ID resolves outside the vault: ../outside.md')
  })

  it('rejects deleting with a path-traversal note ID', async () => {
    await expect(storage.deleteNote('../outside.md')).rejects.toThrow(
      'Note ID resolves outside the vault: ../outside.md',
    )
  })

  it('rejects saving with an absolute-path note ID', async () => {
    await expect(
      storage.saveNote({
        id: '/etc/passwd',
        properties: {},
        content: 'escaped',
      }),
    ).rejects.toThrow('Note ID resolves outside the vault: /etc/passwd')
  })

  it('rejects deleting with an absolute-path note ID', async () => {
    await expect(storage.deleteNote('/tmp/evil.md')).rejects.toThrow(
      'Note ID resolves outside the vault: /tmp/evil.md',
    )
  })
})
