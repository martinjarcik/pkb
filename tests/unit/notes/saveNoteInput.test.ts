import { describe, expect, it } from 'vitest'
import { buildSaveNoteInput } from '~/notes/saveNoteInput'
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
      properties: {
        hasTasks: false,
        tags: [],
      },
    })
  })

  it('preserves user-defined properties', () => {
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
        hasTasks: false,
        tags: ['autosave', 'fixture'],
        meta: {
          nested: true,
        },
      },
    })
  })

  it('includes extracted tags from the saved content', () => {
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
      properties: {
        hasTasks: false,
        tags: ['engineering', 'idea'],
      },
    })
  })

  it('merges existing tags with content-extracted tags', () => {
    const note = {
      id: 'notes/example.md',
      title: 'example',
      description: '',
      tags: ['cooking', 'recipes'],
      content: '',
      createdAt: '2026-03-25T08:00:00.000Z',
      modifiedAt: '2026-03-25T08:00:00.000Z',
    } satisfies Note

    expect(buildSaveNoteInput(note, '#idea #cooking')).toEqual({
      id: 'notes/example.md',
      content: '#idea #cooking',
      properties: {
        hasTasks: false,
        tags: ['cooking', 'idea', 'recipes'],
      },
    })
  })

  it('sets hasTasks to true when saved content contains unchecked tasks', () => {
    const note = {
      id: 'notes/example.md',
      title: 'example',
      description: '',
      content: '',
      createdAt: '2026-03-25T08:00:00.000Z',
      modifiedAt: '2026-03-25T08:00:00.000Z',
    } satisfies Note

    expect(buildSaveNoteInput(note, '- [ ] buy groceries')).toEqual({
      id: 'notes/example.md',
      content: '- [ ] buy groceries',
      properties: {
        hasTasks: true,
        tags: [],
      },
    })
  })

  it('sets hasTasks to false when saved content has no unchecked tasks', () => {
    const note = {
      id: 'notes/example.md',
      title: 'example',
      description: '',
      content: '',
      createdAt: '2026-03-25T08:00:00.000Z',
      modifiedAt: '2026-03-25T08:00:00.000Z',
    } satisfies Note

    expect(buildSaveNoteInput(note, '- [x] done')).toEqual({
      id: 'notes/example.md',
      content: '- [x] done',
      properties: {
        hasTasks: false,
        tags: [],
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
