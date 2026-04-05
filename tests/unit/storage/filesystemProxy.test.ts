import { describe, expect, it, vi } from 'vitest'
import { createFilesystemProxyStorage } from '~/storage/filesystemProxy'
import type { PlatformApi } from '~/storage/platformApi'
import type { Note } from '~/notes/types'

function createTestNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'folder/note.md',
    content: 'Hello world',
    createdAt: '2026-04-01T00:00:00.000Z',
    modifiedAt: '2026-04-02T00:00:00.000Z',
    title: 'note',
    description: 'Hello world',
    ...overrides,
  }
}

function createPlatformApiMock(): PlatformApi {
  return {
    readAllNotes: vi.fn().mockResolvedValue([]),
    writeTextFile: vi.fn().mockResolvedValue({
      content: '',
      birthtime: '2026-04-01T00:00:00.000Z',
      mtime: '2026-04-03T00:00:00.000Z',
    }),
    deleteTextFile: vi.fn().mockResolvedValue(undefined),
    renameTextFile: vi.fn().mockResolvedValue(undefined),
    createDirectory: vi.fn().mockResolvedValue(undefined),
    renameDirectory: vi.fn().mockResolvedValue(undefined),
    listDirectories: vi.fn().mockResolvedValue([]),
    readScopedTextFile: vi.fn().mockResolvedValue(undefined),
    writeScopedTextFile: vi.fn().mockResolvedValue({
      content: '',
      birthtime: '2026-04-01T00:00:00.000Z',
      mtime: '2026-04-03T00:00:00.000Z',
    }),
    ensureReady: vi.fn().mockResolvedValue(undefined),
    uploadAsset: vi.fn(),
    assetUrl: vi.fn((path: string) => path),
    markdownUrlFromAssetUrl: vi.fn((path: string) => path),
  }
}

describe('createFilesystemProxyStorage', () => {
  it('renames without rescanning the vault when the note is provided', async () => {
    const platformApi = createPlatformApiMock()
    const storage = createFilesystemProxyStorage(platformApi, './vault')

    const renamed = await storage.renameNoteTitle({
      id: 'folder/note.md',
      title: 'Renamed',
      existingIds: ['folder/note.md'],
      note: createTestNote(),
    })

    expect(platformApi.readAllNotes).not.toHaveBeenCalled()
    expect(platformApi.renameTextFile).toHaveBeenCalledWith(
      './vault',
      'folder/note.md',
      'folder/Renamed.md',
    )
    expect(renamed.id).toBe('folder/Renamed.md')
  })

  it('moves trashed notes and clears trashedAt without rescanning', async () => {
    const platformApi = createPlatformApiMock()
    const storage = createFilesystemProxyStorage(platformApi, './vault')

    const moved = await storage.moveNote({
      id: 'folder/note.md',
      targetParentPath: '',
      existingIds: ['folder/note.md'],
      note: createTestNote({ trashedAt: '2026-04-02T00:00:00.000Z' }),
    })

    expect(platformApi.readAllNotes).not.toHaveBeenCalled()
    expect(platformApi.renameTextFile).toHaveBeenCalledWith(
      './vault',
      'folder/note.md',
      'note.md',
    )
    expect(platformApi.writeTextFile).toHaveBeenCalled()
    expect(moved.id).toBe('note.md')
    expect(moved.trashedAt).toBeUndefined()
  })

  it('soft-deletes with the provided note payload', async () => {
    const platformApi = createPlatformApiMock()
    const storage = createFilesystemProxyStorage(platformApi, './vault')

    const deleted = await storage.softDeleteNote(
      'folder/note.md',
      createTestNote(),
    )

    expect(platformApi.readAllNotes).not.toHaveBeenCalled()
    expect(platformApi.writeTextFile).toHaveBeenCalled()
    expect(typeof deleted.trashedAt).toBe('string')
  })
})
