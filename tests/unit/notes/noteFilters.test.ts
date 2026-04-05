import { describe, expect, it } from 'vitest'
import {
  isDirectChildOfFolder,
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

describe('isDirectChildOfFolder', () => {
  it('returns true for a note directly inside a top-level folder', () => {
    expect(isDirectChildOfFolder('Work/plan.md', 'Work')).toBe(true)
  })

  it('returns false for a nested note inside a top-level folder', () => {
    expect(isDirectChildOfFolder('Work/archive/plan.md', 'Work')).toBe(false)
  })

  it('returns true for a note directly inside a nested folder', () => {
    expect(isDirectChildOfFolder('Work/archive/plan.md', 'Work/archive')).toBe(
      true,
    )
  })

  it('returns false for a deeply nested note when selecting a mid-level folder', () => {
    expect(
      isDirectChildOfFolder('Work/archive/2024/plan.md', 'Work/archive'),
    ).toBe(false)
  })

  it('returns false for a vault root note', () => {
    expect(isDirectChildOfFolder('plan.md', 'Work')).toBe(false)
  })

  it('returns false for a note in a different folder', () => {
    expect(isDirectChildOfFolder('Personal/plan.md', 'Work')).toBe(false)
  })

  it('returns false when folder path is empty', () => {
    expect(isDirectChildOfFolder('Work/plan.md', '')).toBe(false)
  })

  it('does not match a folder whose name is a prefix of another', () => {
    expect(isDirectChildOfFolder('Working/plan.md', 'Work')).toBe(false)
  })
})
