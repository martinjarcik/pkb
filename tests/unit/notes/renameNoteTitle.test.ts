import { describe, expect, it } from 'vitest'
import {
  createNoteIdFromTitle,
  resolveUniqueNoteId,
  sanitizeNoteTitleForFilename,
} from '~/notes/renameNoteTitle'

describe('renameNoteTitle', () => {
  it('sanitizes path separators and illegal filename characters', () => {
    expect(sanitizeNoteTitleForFilename('  Report: Q1 / Q2?  ')).toBe(
      'Report Q1 Q2',
    )
  })

  it('creates a note id in the current parent folder', () => {
    expect(createNoteIdFromTitle('backlog/old-note.md', 'New Title')).toBe(
      'backlog/New Title.md',
    )
  })

  it('rejects titles without valid filename characters', () => {
    expect(() => createNoteIdFromTitle('note.md', '...///***')).toThrow(
      'Note title must contain at least one valid filename character',
    )
  })

  it('returns the unsuffixed id when no collision exists', () => {
    expect(
      resolveUniqueNoteId('folder/old.md', 'Fresh Title', [
        'folder/old.md',
        'folder/other.md',
      ]),
    ).toBe('folder/Fresh Title.md')
  })

  it('adds a numeric suffix before the extension on collision', () => {
    expect(
      resolveUniqueNoteId('folder/old.md', 'Fresh Title', [
        'folder/Fresh Title.md',
        'folder/Fresh Title (2).md',
        'folder/old.md',
      ]),
    ).toBe('folder/Fresh Title (3).md')
  })
})
