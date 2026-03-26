import { describe, expect, it } from 'vitest'
import type { NoteCatalogRow } from '~/notes/types'
import {
  allTagsFromCatalog,
  filterCatalogBySelectedTags,
} from '~/composables/useSidebarNavigation'

function createCatalogRow(id: string, tags: unknown): NoteCatalogRow {
  return {
    id,
    content: '',
    createdAt: '2026-03-20T00:00:00.000Z',
    modifiedAt: '2026-03-20T00:00:00.000Z',
    title: id,
    description: '',
    tags,
  } as NoteCatalogRow
}

describe('allTagsFromCatalog', () => {
  it('collects all unique tags from the catalog in sorted order', () => {
    expect(
      allTagsFromCatalog([
        createCatalogRow('a.md', ['b', 'a']),
        createCatalogRow('b.md', ['b', 'c']),
      ]),
    ).toEqual(['a', 'b', 'c'])
  })

  it('ignores non-array tag values', () => {
    expect(
      allTagsFromCatalog([
        createCatalogRow('a.md', 'nope'),
        createCatalogRow('b.md', ['tag']),
      ]),
    ).toEqual(['tag'])
  })
})

describe('filterCatalogBySelectedTags', () => {
  it('filters notes by selected tags using AND logic', () => {
    const rows = [
      createCatalogRow('a.md', ['engineering', 'idea']),
      createCatalogRow('b.md', ['engineering', 'dream']),
      createCatalogRow('c.md', ['idea']),
    ]

    expect(
      filterCatalogBySelectedTags(rows, ['engineering', 'idea']).map(
        (row) => row.id,
      ),
    ).toEqual(['a.md'])
  })
})
