import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFilesystemStorage } from '~/storage/filesystem'
import {
  getCachedFilesystemStorage,
  resetDesktopNoteCacheForTests,
} from '../../../server/noteCache'

describe('desktop note cache', () => {
  let vaultPath: string

  beforeEach(async () => {
    vaultPath = await mkdtemp(join(tmpdir(), 'pkb-note-cache-'))
    resetDesktopNoteCacheForTests()
  })

  afterEach(async () => {
    resetDesktopNoteCacheForTests()
    await rm(vaultPath, { recursive: true, force: true })
  })

  it('serves warm catalog and note reads from cache', async () => {
    const diskStorage = createFilesystemStorage(vaultPath)

    await diskStorage.createFolder('Work')
    await diskStorage.saveNote({
      id: 'Work/plan.md',
      properties: { favorite: true },
      content: '# Original',
    })

    const storage = getCachedFilesystemStorage(vaultPath)

    await expect(storage.loadFolders()).resolves.toEqual(['Work'])
    await expect(storage.loadNotesCatalog()).resolves.toMatchObject([
      { id: 'Work/plan.md', title: 'plan' },
    ])
    await expect(storage.loadNoteById('Work/plan.md')).resolves.toMatchObject({
      id: 'Work/plan.md',
      content: '# Original',
    })

    await writeFile(
      join(vaultPath, 'Work', 'plan.md'),
      '# Changed on disk',
      'utf-8',
    )

    await expect(storage.loadNoteById('Work/plan.md')).resolves.toMatchObject({
      content: '# Original',
    })
  })

  it('updates cached note content after save', async () => {
    const storage = getCachedFilesystemStorage(vaultPath)

    await storage.saveNote({
      id: 'draft.md',
      properties: {},
      content: '# Draft',
    })

    await storage.saveNote({
      id: 'draft.md',
      properties: { favorite: true },
      content: '# Published',
    })

    await expect(storage.loadNoteById('draft.md')).resolves.toMatchObject({
      id: 'draft.md',
      content: '# Published',
      favorite: true,
    })
  })

  it('swaps cache keys after renaming a note title', async () => {
    const storage = getCachedFilesystemStorage(vaultPath)

    await storage.saveNote({
      id: 'notes/original.md',
      properties: {},
      content: '# Body',
    })

    await storage.renameNoteTitle({
      id: 'notes/original.md',
      title: 'Renamed',
    })

    await expect(storage.loadNoteById('notes/original.md')).resolves.toBeNull()
    await expect(
      storage.loadNoteById('notes/Renamed.md'),
    ).resolves.toMatchObject({
      id: 'notes/Renamed.md',
    })
  })

  it('reflects move and trash mutations in cached reads', async () => {
    const storage = getCachedFilesystemStorage(vaultPath)

    await storage.createFolder('Work')
    await storage.saveNote({
      id: 'todo.md',
      properties: {},
      content: '- [ ] Item',
    })

    const moved = await storage.moveNote({
      id: 'todo.md',
      targetParentPath: 'Work',
    })

    const trashed = await storage.softDeleteNote(moved.id)

    await expect(storage.loadNoteById('todo.md')).resolves.toBeNull()
    await expect(storage.loadNoteById('Work/todo.md')).resolves.toMatchObject({
      id: 'Work/todo.md',
      trashedAt: trashed.trashedAt,
    })
  })

  it('removes deleted and purged notes from the cache', async () => {
    const storage = getCachedFilesystemStorage(vaultPath)

    await storage.saveNote({
      id: 'remove-me.md',
      properties: {},
      content: '# Remove',
    })
    await storage.saveNote({
      id: 'expired.md',
      properties: { trashedAt: '2020-01-01T00:00:00.000Z' },
      content: '# Expired',
    })

    await storage.deleteNote('remove-me.md')
    await storage.purgeExpiredTrashedNotes(
      30,
      new Date('2026-06-01T00:00:00.000Z'),
    )

    await expect(storage.loadNoteById('remove-me.md')).resolves.toBeNull()
    await expect(storage.loadNoteById('expired.md')).resolves.toBeNull()
    await expect(storage.loadNotesCatalog()).resolves.toEqual([])
  })

  it('reloads cached note ids after folder rename', async () => {
    const storage = getCachedFilesystemStorage(vaultPath)

    await storage.createFolder('Work')
    await storage.saveNote({
      id: 'Work/spec.md',
      properties: {},
      content: '# Spec',
    })

    await storage.renameFolder('Work', 'Projects')

    await expect(storage.loadFolders()).resolves.toEqual(['Projects'])
    await expect(storage.loadNoteById('Work/spec.md')).resolves.toBeNull()
    await expect(
      storage.loadNoteById('Projects/spec.md'),
    ).resolves.toMatchObject({
      id: 'Projects/spec.md',
    })

    const written = await readFile(
      join(vaultPath, 'Projects', 'spec.md'),
      'utf-8',
    )

    expect(written).toBe('# Spec')
  })
})
