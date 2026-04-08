import { describe, expect, it } from 'vitest'
import {
  buildSaveNoteInput,
  normalizeSaveProperties,
} from '~/notes/saveNoteInput'
import type { Note } from '~/notes/types'

describe('buildSaveNoteInput', () => {
  it('omits system property keys including title and description', () => {
    const note = {
      id: 'notes/example.md',
      title: 'example',
      description: '',
      content: '# Hello',
      createdAt: '2026-03-25T08:00:00.000Z',
      modifiedAt: '2026-03-25T08:00:00.000Z',
    } satisfies Note

    expect(buildSaveNoteInput(note, '# Updated')).toEqual({
      id: 'notes/example.md',
      content: '# Updated',
      properties: {},
    })
  })

  it('preserves user-defined properties except obsolete tags', () => {
    const note = {
      id: 'notes/example.md',
      title: 'example',
      description: '',
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
        meta: {
          nested: true,
        },
      },
    })
  })

  it('does not save extracted tags from the content', () => {
    const note = {
      id: 'notes/example.md',
      title: 'example',
      description: '',
      content: '',
      createdAt: '2026-03-25T08:00:00.000Z',
      modifiedAt: '2026-03-25T08:00:00.000Z',
    } satisfies Note

    expect(buildSaveNoteInput(note, '#idea #engineering')).toEqual({
      id: 'notes/example.md',
      content: '#idea #engineering',
      properties: {},
    })
  })

  it('drops obsolete tag properties while preserving other properties', () => {
    const note = {
      id: 'notes/example.md',
      title: 'example',
      description: '',
      tags: ['cooking', 'recipes'],
      favorite: true,
      content: '',
      createdAt: '2026-03-25T08:00:00.000Z',
      modifiedAt: '2026-03-25T08:00:00.000Z',
    } satisfies Note

    expect(buildSaveNoteInput(note, '#idea #cooking')).toEqual({
      id: 'notes/example.md',
      content: '#idea #cooking',
      properties: {
        favorite: true,
      },
    })
  })

  it('preserves the content unchanged', () => {
    const note = {
      id: 'notes/example.md',
      title: 'example',
      description: '',
      content: '',
      createdAt: '2026-03-25T08:00:00.000Z',
      modifiedAt: '2026-03-25T08:00:00.000Z',
    } satisfies Note

    const content = '#idea and #engineering'

    expect(buildSaveNoteInput(note, content).content).toBe(content)
  })
})

describe('normalizeSaveProperties', () => {
  it('sanitizes system properties and drops obsolete tags', () => {
    expect(
      normalizeSaveProperties(
        {
          title: 'shadowed',
          description: 'shadowed',
          createdAt: '2026-03-25T08:00:00.000Z',
          modifiedAt: '2026-03-25T08:00:00.000Z',
          tags: ['existing', 'idea'],
          favorite: true,
          meta: {
            nested: true,
          },
        },
        '#idea\n- [ ] buy groceries',
      ),
    ).toEqual({
      favorite: true,
      meta: {
        nested: true,
      },
    })
  })

  it('drops obsolete tags during normalization', () => {
    expect(
      normalizeSaveProperties(
        {
          tags: ['existing', 'e4afa0ff;text-align:'],
        },
        '#idea',
      ),
    ).toEqual({})
  })
})
