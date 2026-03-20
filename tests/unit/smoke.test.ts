import { describe, expect, it } from 'vitest'
import type { Note } from '~/notes/types'

describe('placeholder unit suite', () => {
  it('passes', () => {
    expect(true).toBe(true)
  })
})

describe('smoke test', () => {
  it('creates a Note object', () => {
    const note: Note = {
      id: 'notes/test.md',
      content: 'Hello',
      createdAt: '2026-01-01',
      modifiedAt: '2026-01-01',
    }

    expect(note.id).toBe('notes/test.md')
    expect(note.content).toBe('Hello')
  })
})
