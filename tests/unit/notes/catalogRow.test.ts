import { describe, expect, it } from 'vitest'
import { createNoteCatalogRow } from '~/notes/catalogRow'

describe('createNoteCatalogRow', () => {
  it('preserves note fields other than content', () => {
    const note = {
      id: 'recipes/pasta.md',
      content: 'Hello',
      createdAt: '2026-03-01T10:00:00.000Z',
      modifiedAt: '2026-03-02T10:00:00.000Z',
      title: 'pasta',
      description: 'Short description',
      favorite: true,
    }

    expect(createNoteCatalogRow(note)).toMatchObject({
      id: note.id,
      createdAt: note.createdAt,
      modifiedAt: note.modifiedAt,
      title: note.title,
      description: note.description,
      favorite: true,
    })
  })

  it('omits content from catalog rows', () => {
    const note = {
      id: 'long.md',
      content: 'a'.repeat(2048),
      createdAt: '2026-03-01T10:00:00.000Z',
      modifiedAt: '2026-03-02T10:00:00.000Z',
      title: 'long',
      description: 'Long description',
    }

    expect('content' in createNoteCatalogRow(note)).toBe(false)
  })
})
