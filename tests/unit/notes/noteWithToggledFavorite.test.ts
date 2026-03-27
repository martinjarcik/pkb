import { describe, expect, it } from 'vitest'
import { noteWithToggledFavorite } from '~/notes/noteWithToggledFavorite'
import type { Note } from '~/notes/types'

function baseNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n.md',
    content: '# Hi',
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
    title: 'n',
    description: 'Hi',
    ...overrides,
  }
}

describe('noteWithToggledFavorite', () => {
  it('sets favorite true when it was absent', () => {
    const next = noteWithToggledFavorite(baseNote())

    expect(next.favorite).toBe(true)
  })

  it('removes favorite when it was true', () => {
    const next = noteWithToggledFavorite(baseNote({ favorite: true }))

    expect(next.favorite).toBeUndefined()
  })
})
