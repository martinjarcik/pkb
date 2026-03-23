import { describe, expect, it, vi } from 'vitest'
import type { Note } from '~/notes/types'
import type { NoteStorage } from '~/storage/types'
import { loadNotesResponse } from '../../server/api/notes.get'

function createStorage(loadNotesResult: Note[]): NoteStorage {
  return {
    loadNotes: vi.fn().mockResolvedValue(loadNotesResult),
    saveNote: vi.fn(),
    deleteNote: vi.fn(),
  }
}

describe('loadNotesResponse', () => {
  it('returns the loaded notes payload unchanged', async () => {
    const notes: Note[] = [
      {
        id: 'first.md',
        title: 'First',
        content: '# Hello',
        createdAt: '2026-03-23T00:00:00.000Z',
        modifiedAt: '2026-03-23T00:00:00.000Z',
      },
    ]

    const storage = createStorage(notes)

    await expect(loadNotesResponse(storage)).resolves.toEqual(notes)
  })

  it('returns an empty payload for an empty vault', async () => {
    const storage = createStorage([])

    await expect(loadNotesResponse(storage)).resolves.toEqual([])
  })
})
