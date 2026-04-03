import { readFile, writeFile, mkdtemp, rm, stat, utimes } from 'fs/promises'
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
      properties: { label: 'Welcome', published: true },
      content: '# Hello',
    })

    const written = await readFile(join(vaultPath, 'welcome.md'), 'utf-8')

    expect(written).toBe('---\nlabel: Welcome\npublished: true\n---\n# Hello')
  })

  it('loads all notes with full content and frontmatter properties', async () => {
    await writeFile(
      join(vaultPath, 'hello.md'),
      '---\nlabel: Hello\npublished: true\n---\n# Content',
      'utf-8',
    )

    const [note] = await storage.loadAllNotes()

    expect(note).toMatchObject({
      id: 'hello.md',
      label: 'Hello',
      published: true,
      content: '# Content',
    })
  })

  it('reads modification timestamp from the file system', async () => {
    const filePath = join(vaultPath, 'hello.md')

    await writeFile(filePath, '# Content', 'utf-8')

    const mtime = new Date('2026-03-20T12:00:00.000Z')
    await utimes(filePath, mtime, mtime)

    const [note] = await storage.loadAllNotes()

    expect(note?.modifiedAt).toBe('2026-03-20T12:00:00.000Z')
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

    const notes = await storage.loadAllNotes()

    expect(notes.map((n) => n.id)).toEqual(['newer.md', 'older.md'])
  })

  it('preserves frontmatter properties across save and load', async () => {
    await storage.saveNote({
      id: 'round-trip.md',
      properties: {
        label: 'Round Trip',
        views: 3,
        meta: { nested: true },
        tags: ['a', 'b'],
      },
      content: '# Body',
    })

    const [note] = await storage.loadAllNotes()

    expect(note).toMatchObject({
      label: 'Round Trip',
      views: 3,
      meta: { nested: true },
      tags: ['a', 'b'],
      content: '# Body',
    })
  })

  it('creates intermediate directories when saving a nested note', async () => {
    await storage.saveNote({
      id: 'sub/deep/note.md',
      properties: { label: 'Deep' },
      content: '# Nested',
    })

    const written = await readFile(
      join(vaultPath, 'sub', 'deep', 'note.md'),
      'utf-8',
    )

    expect(written).toBe('---\nlabel: Deep\n---\n# Nested')
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
      properties: { label: 'Delete Me' },
      content: '# Gone',
    })

    await storage.deleteNote('to-delete.md')

    const notes = await storage.loadAllNotes()

    expect(notes).toHaveLength(0)
  })

  it('renames a note title and returns the new id', async () => {
    await storage.saveNote({
      id: 'nested/original.md',
      properties: { label: 'Original' },
      content: '# Body',
    })

    const renamed = await storage.renameNoteTitle({
      id: 'nested/original.md',
      title: 'Updated title',
    })

    expect(renamed.id).toBe('nested/Updated title.md')
  })

  it('moves the file on disk when renaming a note title', async () => {
    await storage.saveNote({
      id: 'nested/original.md',
      properties: { label: 'Original' },
      content: '# Body',
    })

    await storage.renameNoteTitle({
      id: 'nested/original.md',
      title: 'Updated title',
    })

    const written = await readFile(
      join(vaultPath, 'nested', 'Updated title.md'),
      'utf-8',
    )

    expect(written).toBe('---\nlabel: Original\n---\n# Body')
  })

  it('adds a numeric suffix when renaming to a colliding title', async () => {
    await storage.saveNote({
      id: 'notes/first.md',
      properties: { label: 'First' },
      content: '# First',
    })
    await storage.saveNote({
      id: 'notes/second.md',
      properties: { label: 'Second' },
      content: '# Second',
    })

    const renamed = await storage.renameNoteTitle({
      id: 'notes/second.md',
      title: 'first',
    })

    expect(renamed.id).toBe('notes/first (2).md')
  })

  it('returns an empty array when the vault is empty', async () => {
    const notes = await storage.loadAllNotes()

    expect(notes).toEqual([])
  })

  it('isolates content from broken frontmatter', async () => {
    await writeFile(
      join(vaultPath, 'broken.md'),
      '---\nlabel: [invalid yaml\n---\n# Still readable',
      'utf-8',
    )

    const notes = await storage.loadAllNotes()

    expect(notes).toHaveLength(1)
    expect(notes[0]!.title).toBe('broken')
    expect(notes[0]!.content).toBe('# Still readable')
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

  it('creates a folder as a directory inside the vault', async () => {
    await storage.createFolder('Projects')

    const folderStat = await stat(join(vaultPath, 'Projects'))

    expect(folderStat.isDirectory()).toBe(true)
  })

  it('does not throw when creating a folder that already exists', async () => {
    await storage.createFolder('Existing')
    await expect(storage.createFolder('Existing')).resolves.toBeUndefined()
  })

  it('rejects creating a folder with a path-traversal name', async () => {
    await expect(storage.createFolder('../escape')).rejects.toThrow(
      'Note ID resolves outside the vault: ../escape',
    )
  })

  it('loads top-level folder names from the vault', async () => {
    await storage.createFolder('Work')
    await storage.createFolder('Personal')

    const folders = await storage.loadExplicitFolders()

    expect(folders).toEqual(['Personal', 'Work'])
  })

  it('returns an empty array when no folders exist', async () => {
    const folders = await storage.loadExplicitFolders()

    expect(folders).toEqual([])
  })

  it('softDeleteNote sets trashedAt in frontmatter', async () => {
    await storage.saveNote({
      id: 'keep.md',
      properties: { hasTasks: false },
      content: '# A',
    })

    const trashed = await storage.softDeleteNote('keep.md')

    expect(typeof trashed.trashedAt).toBe('string')
    expect((trashed.trashedAt as string).length).toBeGreaterThan(0)

    const written = await readFile(join(vaultPath, 'keep.md'), 'utf-8')

    expect(written).toContain('trashedAt')
  })

  it('moveNote removes trashedAt from persisted document', async () => {
    await storage.createFolder('Work')
    await storage.saveNote({
      id: 'gone.md',
      properties: {
        hasTasks: false,
        trashedAt: '2025-01-01T00:00:00.000Z',
      },
      content: '# T',
    })

    const moved = await storage.moveNote({
      id: 'gone.md',
      targetParentPath: 'Work',
    })

    expect(moved.trashedAt).toBeUndefined()

    const written = await readFile(join(vaultPath, 'Work', 'gone.md'), 'utf-8')

    expect(written).not.toContain('trashedAt')
  })
})
