import { describe, expect, it } from 'vitest'
import { noteWithToggledPinned } from '~/notes/noteWithToggledPinned'
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

describe('noteWithToggledPinned', () => {
  it('sets pinned true when it was absent', () => {
    const next = noteWithToggledPinned(baseNote())

    expect(next.pinned).toBe(true)
  })

  it('removes pinned when it was true', () => {
    const next = noteWithToggledPinned(baseNote({ pinned: true }))

    expect(next.pinned).toBeUndefined()
  })
})
