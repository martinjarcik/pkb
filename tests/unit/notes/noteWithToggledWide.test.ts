import { describe, expect, it } from 'vitest'
import { noteWithToggledWide } from '~/notes/noteWithToggledWide'
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

describe('noteWithToggledWide', () => {
  it('sets wide true when it was absent', () => {
    const next = noteWithToggledWide(baseNote())

    expect(next.wide).toBe(true)
  })

  it('removes wide when it was true', () => {
    const next = noteWithToggledWide(baseNote({ wide: true }))

    expect(next.wide).toBeUndefined()
  })
})
