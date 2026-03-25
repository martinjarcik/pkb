import { describe, expect, it } from 'vitest'
import { noteNameFromId } from '~/notes/noteNameFromId'

describe('noteNameFromId', () => {
  it('returns the file stem for a flat id', () => {
    expect(noteNameFromId('my-note.md')).toBe('my-note')
  })

  it('returns the file stem for a nested vault path', () => {
    expect(noteNameFromId('backlog/this-is-file-name.md')).toBe(
      'this-is-file-name',
    )
  })

  it('does not strip path segments', () => {
    expect(noteNameFromId('folder/note.md')).toBe('note')
  })

  it('leaves ids without .md unchanged', () => {
    expect(noteNameFromId('README')).toBe('README')
  })

  it('normalizes backslashes for basename', () => {
    expect(noteNameFromId('a\\b\\note.md')).toBe('note')
  })
})
