import { describe, expect, it } from 'vitest'
import { buildSaveNoteInput } from '~/notes/saveNoteInput'
import type { Note } from '~/notes/types'

describe('buildSaveNoteInput', () => {
  it('omits system property keys from properties', () => {
    const note = {
      id: 'notes/example.md',
      title: 'Example',
      content: '# Hello',
      createdAt: '2026-03-25T08:00:00.000Z',
      modifiedAt: '2026-03-25T08:00:00.000Z',
    } satisfies Note

    expect(buildSaveNoteInput(note, '# Updated')).toEqual({
      id: 'notes/example.md',
      content: '# Updated',
      properties: {
        title: 'Example',
      },
    })
  })

  it('preserves user-defined properties', () => {
    const note = {
      id: 'notes/example.md',
      title: 'Example',
      tags: ['fixture', 'autosave'],
      meta: {
        nested: true,
      },
      content: '# Hello',
      createdAt: '2026-03-25T08:00:00.000Z',
      modifiedAt: '2026-03-25T08:00:00.000Z',
    } satisfies Note

    expect(buildSaveNoteInput(note, '# Updated')).toEqual({
      id: 'notes/example.md',
      content: '# Updated',
      properties: {
        title: 'Example',
        tags: ['fixture', 'autosave'],
        meta: {
          nested: true,
        },
      },
    })
  })
})
