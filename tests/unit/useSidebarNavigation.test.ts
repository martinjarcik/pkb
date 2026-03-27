import { describe, expect, it } from 'vitest'
import type { NoteCatalogRow } from '~/notes/types'
import {
  allTagsFromCatalog,
  applyTagCycle,
  cycleTagState,
  filterCatalogBySelectedTags,
  mergeTopLevelFolders,
  selectedTagsFromView,
  type SidebarWorkspaceView,
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

describe('mergeTopLevelFolders', () => {
  it('returns sorted union of catalog-derived and explicit folders', () => {
    expect(mergeTopLevelFolders(['Work', 'Travel'], ['Projects'])).toEqual([
      'Projects',
      'Travel',
      'Work',
    ])
  })

  it('deduplicates folders that appear in both sources', () => {
    expect(mergeTopLevelFolders(['Work'], ['Work', 'Home'])).toEqual([
      'Home',
      'Work',
    ])
  })

  it('returns empty array when both sources are empty', () => {
    expect(mergeTopLevelFolders([], [])).toEqual([])
  })
})

describe('cycleTagState', () => {
  it('returns active for an idle tag', () => {
    expect(cycleTagState('idle')).toBe('active')
  })

  it('returns pinned for an active tag', () => {
    expect(cycleTagState('active')).toBe('pinned')
  })

  it('returns idle for a pinned tag', () => {
    expect(cycleTagState('pinned')).toBe('idle')
  })
})

describe('applyTagCycle', () => {
  it('activating an idle tag demotes the previously active tag', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      activeTags: ['idea'],
      pinnedTags: [],
    }

    expect(applyTagCycle(view, 'engineering')).toEqual({
      kind: 'tags',
      activeTags: ['engineering'],
      pinnedTags: [],
    })
  })

  it('activating a tag preserves pinned tags', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      activeTags: ['idea'],
      pinnedTags: ['dream'],
    }

    expect(applyTagCycle(view, 'engineering')).toEqual({
      kind: 'tags',
      activeTags: ['engineering'],
      pinnedTags: ['dream'],
    })
  })

  it('pinning an active tag moves it to pinnedTags', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      activeTags: ['engineering'],
      pinnedTags: [],
    }

    expect(applyTagCycle(view, 'engineering')).toEqual({
      kind: 'tags',
      activeTags: [],
      pinnedTags: ['engineering'],
    })
  })

  it('unpinning a pinned tag removes it', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      activeTags: ['idea'],
      pinnedTags: ['engineering'],
    }

    expect(applyTagCycle(view, 'engineering')).toEqual({
      kind: 'tags',
      activeTags: ['idea'],
      pinnedTags: [],
    })
  })

  it('returns null when no tags remain', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      activeTags: [],
      pinnedTags: ['engineering'],
    }

    expect(applyTagCycle(view, 'engineering')).toBeNull()
  })

  it('activating from inbox view creates a tags view', () => {
    const view: SidebarWorkspaceView = { kind: 'inbox' }

    expect(applyTagCycle(view, 'engineering')).toEqual({
      kind: 'tags',
      activeTags: ['engineering'],
      pinnedTags: [],
    })
  })
})

describe('selectedTagsFromView', () => {
  it('returns sorted union of activeTags and pinnedTags', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      activeTags: ['idea'],
      pinnedTags: ['engineering'],
    }

    expect(selectedTagsFromView(view)).toEqual(['engineering', 'idea'])
  })

  it('returns empty array for non-tags views', () => {
    expect(selectedTagsFromView({ kind: 'inbox' })).toEqual([])
  })
})
