import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFilesystemStorage } from '~/storage/filesystem'
import {
  getCachedFilesystemStorage,
  resetDesktopNoteCacheForTests,
} from '../../../server/noteCache'
import { searchNoteIds } from '../../../server/noteSearch'

describe('searchNoteIds', () => {
  let vaultPath: string

  beforeEach(async () => {
    vaultPath = await mkdtemp(join(tmpdir(), 'pkb-note-search-'))
    resetDesktopNoteCacheForTests()
  })

  afterEach(async () => {
    resetDesktopNoteCacheForTests()
    await rm(vaultPath, { recursive: true, force: true })
  })

  it('returns ids for title and full-content matches', async () => {
    const storage = createFilesystemStorage(vaultPath)

    await storage.saveNote({
      id: 'title-match.md',
      properties: {},
      content: 'No special phrase here.',
    })
    await storage.saveNote({
      id: 'content-match.md',
      properties: {},
      content: 'This note contains the bridge phrase in the body.',
    })

    await expect(searchNoteIds(storage, 'bridge')).resolves.toEqual([
      'content-match.md',
    ])
    await expect(searchNoteIds(storage, 'TITLE-MATCH')).resolves.toEqual([
      'title-match.md',
    ])
  })

  it('includes trashed notes in search results', async () => {
    const storage = createFilesystemStorage(vaultPath)

    await storage.saveNote({
      id: 'trashed.md',
      properties: { trashedAt: '2026-03-20T00:00:00.000Z' },
      content: 'Keep this searchable.',
    })

    await expect(searchNoteIds(storage, 'searchable')).resolves.toEqual([
      'trashed.md',
    ])
  })

  it('uses cached desktop notes instead of rereading files during search', async () => {
    const diskStorage = createFilesystemStorage(vaultPath)

    await diskStorage.saveNote({
      id: 'cached.md',
      properties: {},
      content: 'Alpha cache content',
    })

    const cachedStorage = getCachedFilesystemStorage(vaultPath)

    await cachedStorage.loadNotesCatalog()
    await writeFile(join(vaultPath, 'cached.md'), 'Beta disk content', 'utf-8')

    await expect(searchNoteIds(cachedStorage, 'alpha')).resolves.toEqual([
      'cached.md',
    ])
    await expect(searchNoteIds(cachedStorage, 'beta')).resolves.toEqual([])
  })
})
