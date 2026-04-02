import { describe, expect, it } from 'vitest'
import {
  isDirectChildOfVaultFolder,
  isVaultRootNote,
  vaultTopLevelFolderNames,
} from '~/notes/noteFilters'

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

describe('vaultTopLevelFolderNames', () => {
  it('returns sorted distinct top-level folders', () => {
    expect(
      vaultTopLevelFolderNames([
        'Work/report.md',
        'Travel/packing.md',
        'Work/notes.md',
        'root.md',
        'Travel/drafts/day-1.md',
      ]),
    ).toEqual(['Travel', 'Work'])
  })

  it('returns an empty array when every note is at the vault root', () => {
    expect(vaultTopLevelFolderNames(['a.md', 'b.md'])).toEqual([])
  })
})

describe('isDirectChildOfVaultFolder', () => {
  it('returns true for a note directly inside the selected folder', () => {
    expect(isDirectChildOfVaultFolder('Work/plan.md', 'Work')).toBe(true)
  })

  it('returns false for a nested note inside the selected folder', () => {
    expect(isDirectChildOfVaultFolder('Work/archive/plan.md', 'Work')).toBe(
      false,
    )
  })

  it('returns false for a vault root note', () => {
    expect(isDirectChildOfVaultFolder('plan.md', 'Work')).toBe(false)
  })

  it('returns false for a note in a different folder', () => {
    expect(isDirectChildOfVaultFolder('Personal/plan.md', 'Work')).toBe(false)
  })

  it('returns false when the folder name is not a top-level folder', () => {
    expect(isDirectChildOfVaultFolder('Work/plan.md', 'Work/archive')).toBe(
      false,
    )
  })
})
