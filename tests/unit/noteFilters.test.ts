import { describe, expect, it } from 'vitest'
import { isVaultRootNote } from '~/notes/noteFilters'

describe('isVaultRootNote', () => {
  it('returns true for a vault root note', () => {
    expect(isVaultRootNote('Note.md')).toBe(true)
  })

  it('returns false for a note in a subdirectory', () => {
    expect(isVaultRootNote('sub/Note.md')).toBe(false)
  })

  it('returns false for a deeply nested note', () => {
    expect(isVaultRootNote('a/b/Note.md')).toBe(false)
  })
})
