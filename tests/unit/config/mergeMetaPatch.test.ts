import { describe, expect, it } from 'vitest'
import { deepMergeMeta } from '../../../app/config/mergeMetaPatch'

describe('deepMergeMeta', () => {
  it('removes a folder when patch sets null', () => {
    const merged = deepMergeMeta(
      { folders: { Work: { icon: '📁' } } },
      { folders: { Work: null } },
    )

    expect(merged).toEqual({ folders: {} })
  })

  it('merges nested folder icon', () => {
    const merged = deepMergeMeta(
      { folders: { Work: { icon: '📁' } } },
      { folders: { Work: { icon: '🎉' } } },
    )

    expect(merged).toEqual({ folders: { Work: { icon: '🎉' } } })
  })
})
