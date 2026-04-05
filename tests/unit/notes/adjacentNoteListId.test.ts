import { describe, expect, it } from 'vitest'
import { adjacentNoteListId } from '~/notes/adjacentNoteListId'

describe('adjacentNoteListId', () => {
  it('returns null for an empty list', () => {
    expect(adjacentNoteListId([], null, 'next')).toBeNull()
  })

  it('selects the first id when moving next with no current id', () => {
    expect(adjacentNoteListId(['a', 'b'], null, 'next')).toBe('a')
  })

  it('selects the last id when moving previous with no current id', () => {
    expect(adjacentNoteListId(['a', 'b'], null, 'previous')).toBe('b')
  })

  it('returns the next id when not at the end', () => {
    expect(adjacentNoteListId(['a', 'b', 'c'], 'a', 'next')).toBe('b')
  })

  it('returns null when moving next from the last id', () => {
    expect(adjacentNoteListId(['a', 'b'], 'b', 'next')).toBeNull()
  })

  it('returns the previous id when not at the start', () => {
    expect(adjacentNoteListId(['a', 'b', 'c'], 'c', 'previous')).toBe('b')
  })

  it('returns null when moving previous from the first id', () => {
    expect(adjacentNoteListId(['a', 'b'], 'a', 'previous')).toBeNull()
  })

  it('treats an unknown current id like no selection for next', () => {
    expect(adjacentNoteListId(['a', 'b'], 'missing', 'next')).toBe('a')
  })

  it('treats an unknown current id like no selection for previous', () => {
    expect(adjacentNoteListId(['a', 'b'], 'missing', 'previous')).toBe('b')
  })
})
