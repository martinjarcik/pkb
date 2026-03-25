import { describe, expect, it } from 'vitest'
import { noteTitleFromId } from '~/notes/noteTitleFromId'

describe('noteTitleFromId', () => {
  it('returns the file stem for a flat id', () => {
    expect(noteTitleFromId('my-note.md')).toBe('my-note')
  })

  it('returns the file stem for a nested vault path', () => {
    expect(noteTitleFromId('backlog/this-is-file-name.md')).toBe(
      'this-is-file-name',
    )
  })

  it('does not strip path segments', () => {
    expect(noteTitleFromId('folder/note.md')).toBe('note')
  })

  it('leaves ids without .md unchanged', () => {
    expect(noteTitleFromId('README')).toBe('README')
  })

  it('normalizes backslashes for basename', () => {
    expect(noteTitleFromId('a\\b\\note.md')).toBe('note')
  })
})
