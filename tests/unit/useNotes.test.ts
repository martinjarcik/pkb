import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Note } from '~/notes/types'
import { createNotesListItems, useNotes } from '~/composables/useNotes'

const { fetchMock, stateStore } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  stateStore: new Map<string, { value: unknown }>(),
}))

vi.mock('#app', () => {
  return {
    useState<T>(key: string, init: () => T) {
      if (!stateStore.has(key)) {
        stateStore.set(key, { value: init() })
      }

      return stateStore.get(key) as { value: T }
    },
  }
})

function createNote(id: string, content: string, modifiedAt: string): Note {
  return {
    id,
    content,
    createdAt: '2026-03-20T00:00:00.000Z',
    modifiedAt,
  }
}

describe('useNotes', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    stateStore.clear()
    vi.stubGlobal('$fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads notes into shared state', async () => {
    const loadedNotes = [
      createNote(
        'second.md',
        '# Second note\n\nSome note content',
        '2026-03-23',
      ),
    ]

    fetchMock.mockResolvedValue(loadedNotes)

    const { notes, isLoading, loadError, loadNotes } = useNotes()

    await expect(loadNotes()).resolves.toEqual(loadedNotes)

    expect(fetchMock).toHaveBeenCalledWith('/api/notes')
    expect(notes.value).toEqual(loadedNotes)
    expect(isLoading.value).toBe(false)
    expect(loadError.value).toBeNull()
  })

  it('handles empty payload', async () => {
    fetchMock.mockResolvedValue([])

    const { notes, isLoading, loadNotes } = useNotes()

    await expect(loadNotes()).resolves.toEqual([])

    expect(notes.value).toEqual([])
    expect(isLoading.value).toBe(false)
  })

  it('preserves display order and title source', () => {
    const listItems = createNotesListItems([
      createNote(
        'second.md',
        '# Second note\n\nSome note content',
        '2026-03-23',
      ),
      createNote(
        'first.md',
        '# First note\n\nA longer preview body for the first note.',
        '2026-03-20',
      ),
    ])

    expect(listItems).toEqual([
      {
        id: 'second.md',
        title: 'second.md',
        description: 'Some note content',
        meta: '2026-03-23',
      },
      {
        id: 'first.md',
        title: 'first.md',
        description: 'A longer preview body for the first note.',
        meta: '2026-03-20',
      },
    ])
  })

  it('omits markdown heading lines from the description preview', () => {
    const [listItem] = createNotesListItems([
      createNote(
        'headings.md',
        '# Heading one\n\n## Heading two\n\nBody paragraph that should be shown.',
        '2026-03-24',
      ),
    ])

    expect(listItem).toEqual({
      id: 'headings.md',
      title: 'headings.md',
      description: 'Body paragraph that should be shown.',
      meta: '2026-03-24',
    })
  })
})
