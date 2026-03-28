import { describe, expect, it } from 'vitest'
import { parseFolderMeta, parseMeta } from '../../../app/config/parseMeta'

describe('parseMeta', () => {
  it('returns empty folders for undefined input', () => {
    expect(parseMeta(undefined)).toEqual({ folders: {} })
  })

  it('parses valid folder metadata', () => {
    expect(
      parseMeta({
        folders: {
          Work: { icon: '📁' },
        },
      }),
    ).toEqual({
      folders: {
        Work: { icon: '📁' },
      },
    })
  })

  it('ignores unknown keys on folder entries', () => {
    expect(
      parseMeta({
        folders: {
          Work: { icon: '📁', extra: 1, other: 'x' },
        },
      }),
    ).toEqual({
      folders: {
        Work: { icon: '📁' },
      },
    })
  })

  it('rejects invalid folder icon type', () => {
    expect(() =>
      parseMeta({
        folders: {
          Work: { icon: 1 },
        },
      }),
    ).toThrow('Folder meta icon must be a string')
  })
})

describe('parseFolderMeta', () => {
  it('rejects non-object folder meta', () => {
    expect(() => parseFolderMeta('x')).toThrow('Folder meta must be an object')
  })
})
