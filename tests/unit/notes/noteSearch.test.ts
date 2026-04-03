import { describe, expect, it } from 'vitest'
import { filterOrderedCatalogRowsByIds } from '~/notes/noteSearch'
import type { NoteCatalogRow } from '~/notes/types'

function createCatalogRow(
  id: string,
  modifiedAt: string,
  properties: Partial<NoteCatalogRow> = {},
): NoteCatalogRow {
  return {
    id,
    createdAt: modifiedAt,
    modifiedAt,
    title: id,
    description: '',
    ...properties,
  }
}

describe('filterOrderedCatalogRowsByIds', () => {
  it('returns only rows whose ids are included in the matching set', () => {
    const rows = [
      createCatalogRow('a.md', '2026-03-20T00:00:00.000Z'),
      createCatalogRow('b.md', '2026-03-19T00:00:00.000Z'),
      createCatalogRow('c.md', '2026-03-18T00:00:00.000Z'),
    ]

    expect(filterOrderedCatalogRowsByIds(rows, ['b.md', 'c.md'])).toEqual([
      rows[1],
      rows[2],
    ])
  })

  it('keeps pinned notes before non-pinned notes in filtered results', () => {
    const rows = [
      createCatalogRow('recent.md', '2026-03-20T00:00:00.000Z'),
      createCatalogRow('pinned.md', '2026-03-19T00:00:00.000Z', {
        pinned: true,
      }),
      createCatalogRow('older.md', '2026-03-18T00:00:00.000Z'),
    ]

    expect(
      filterOrderedCatalogRowsByIds(rows, [
        'recent.md',
        'older.md',
        'pinned.md',
      ]).map((row) => row.id),
    ).toEqual(['pinned.md', 'recent.md', 'older.md'])
  })
})
