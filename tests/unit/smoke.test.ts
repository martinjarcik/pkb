import { describe, it, expect } from 'vitest'
import type { Note } from '~/notes/types'

describe('smoke test', () => {
  it('creates a Note object', () => {
    const note: Note = {
      id: '1',
      title: 'Test',
      content: 'Hello',
      metadata: {
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    }

    expect(note.id).toBe('1')
    expect(note.title).toBe('Test')
  })
})
