import { describe, expect, it } from 'vitest'
import {
  createNoteIdFromTitle,
  moveNoteId,
  resolveUniqueNoteId,
  resolveUniqueNoteIdForParentPath,
  sanitizeNoteTitleForFilename,
} from '~/notes/noteId'

describe('noteId', () => {
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

  it('creates a unique id directly in the provided parent path', () => {
    expect(
      resolveUniqueNoteIdForParentPath('folder', 'Fresh Title', [
        'folder/Fresh Title.md',
        'other/Fresh Title.md',
      ]),
    ).toBe('folder/Fresh Title (2).md')
  })

  it('creates a root id when the parent path is empty', () => {
    expect(
      resolveUniqueNoteIdForParentPath('', 'Fresh Title', ['Fresh Title.md']),
    ).toBe('Fresh Title (2).md')
  })

  it('returns the same id when the note is already in the target folder', () => {
    expect(
      moveNoteId('recipes/Pasta.md', 'recipes', ['recipes/Pasta.md']),
    ).toBe('recipes/Pasta.md')
  })

  it('moves a vault root note into a folder', () => {
    expect(moveNoteId('Pasta.md', 'recipes', ['Pasta.md'])).toBe(
      'recipes/Pasta.md',
    )
  })

  it('moves a folder note back to the vault root', () => {
    expect(moveNoteId('recipes/Pasta.md', '', ['recipes/Pasta.md'])).toBe(
      'Pasta.md',
    )
  })

  it('moves a note between folders', () => {
    expect(moveNoteId('work/Report.md', 'archive', ['work/Report.md'])).toBe(
      'archive/Report.md',
    )
  })

  it('adds a numeric suffix when moving into a folder with a collision', () => {
    expect(
      moveNoteId('Pasta.md', 'recipes', ['Pasta.md', 'recipes/Pasta.md']),
    ).toBe('recipes/Pasta (2).md')
  })
})
