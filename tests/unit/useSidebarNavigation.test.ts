import { describe, expect, it } from 'vitest'
import type { NoteCatalogRow } from '~/notes/types'
import {
  allTagsFromCatalog,
  applyTagCycle,
  cycleTagState,
  filterCatalogByHasTasks,
  filterCatalogBySelectedTags,
  filterCatalogForSidebarView,
  mergeTopLevelFolders,
  orderedCatalogRowsForSidebarView,
  selectedTagsFromView,
  sortCatalogRowsPinnedFirstByModifiedAt,
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

describe('filterCatalogByHasTasks', () => {
  it('returns only notes with hasTasks set to true', () => {
    const rows = [
      createCatalogRow('a.md', []),
      {
        ...createCatalogRow('b.md', []),
        hasTasks: true,
      },
      {
        ...createCatalogRow('c.md', []),
        hasTasks: false,
      },
    ]

    expect(filterCatalogByHasTasks(rows).map((row) => row.id)).toEqual(['b.md'])
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

describe('filterCatalogForSidebarView', () => {
  it('excludes trashed notes from inbox', () => {
    const rows = [
      createCatalogRow('a.md', []),
      {
        ...createCatalogRow('b.md', []),
        trashedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    expect(
      filterCatalogForSidebarView(rows, { kind: 'inbox' }).map((r) => r.id),
    ).toEqual(['a.md'])
  })

  it('lists only trashed notes in trashed view', () => {
    const rows = [
      createCatalogRow('a.md', []),
      {
        ...createCatalogRow('b.md', []),
        trashedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    expect(
      filterCatalogForSidebarView(rows, { kind: 'trashed' }).map((r) => r.id),
    ).toEqual(['b.md'])
  })

  it('excludes trashed notes from tasks view', () => {
    const rows = [
      {
        ...createCatalogRow('task.md', []),
        hasTasks: true,
      },
      {
        ...createCatalogRow('trashed-task.md', []),
        hasTasks: true,
        trashedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    expect(
      filterCatalogForSidebarView(rows, { kind: 'tasks' }).map((r) => r.id),
    ).toEqual(['task.md'])
  })

  it('lists only non-trashed favorited notes in favorites view', () => {
    const rows = [
      createCatalogRow('plain.md', []),
      {
        ...createCatalogRow('fav.md', []),
        favorite: true,
      },
      {
        ...createCatalogRow('trashed-fav.md', []),
        favorite: true,
        trashedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    expect(
      filterCatalogForSidebarView(rows, { kind: 'favorites' }).map((r) => r.id),
    ).toEqual(['fav.md'])
  })

  it('returns no notes in favorites view when none are favorited', () => {
    const rows = [
      createCatalogRow('a.md', []),
      {
        ...createCatalogRow('b.md', []),
        favorite: false,
      },
    ]

    expect(
      filterCatalogForSidebarView(rows, { kind: 'favorites' }),
    ).toHaveLength(0)
  })
})

describe('sortCatalogRowsPinnedFirstByModifiedAt', () => {
  it('orders pinned notes before non-pinned notes', () => {
    const rows = [
      {
        ...createCatalogRow('newer.md', []),
        modifiedAt: '2026-03-26T12:00:00.000Z',
      },
      {
        ...createCatalogRow('pinned-older.md', []),
        modifiedAt: '2026-03-20T12:00:00.000Z',
        pinned: true,
      },
    ]

    expect(
      sortCatalogRowsPinnedFirstByModifiedAt(rows).map((r) => r.id),
    ).toEqual(['pinned-older.md', 'newer.md'])
  })

  it('orders multiple pinned notes by modifiedAt descending', () => {
    const rows = [
      {
        ...createCatalogRow('p-old.md', []),
        modifiedAt: '2026-03-20T12:00:00.000Z',
        pinned: true,
      },
      {
        ...createCatalogRow('p-new.md', []),
        modifiedAt: '2026-03-26T12:00:00.000Z',
        pinned: true,
      },
    ]

    expect(
      sortCatalogRowsPinnedFirstByModifiedAt(rows).map((r) => r.id),
    ).toEqual(['p-new.md', 'p-old.md'])
  })
})

describe('orderedCatalogRowsForSidebarView', () => {
  it('applies inbox filter then pinned-first ordering', () => {
    const rows = [
      {
        ...createCatalogRow('inbox-newer.md', []),
        modifiedAt: '2026-03-26T12:00:00.000Z',
      },
      {
        ...createCatalogRow('inbox-pinned.md', []),
        modifiedAt: '2026-03-20T12:00:00.000Z',
        pinned: true,
      },
    ]

    expect(
      orderedCatalogRowsForSidebarView(rows, { kind: 'inbox' }).map(
        (r) => r.id,
      ),
    ).toEqual(['inbox-pinned.md', 'inbox-newer.md'])
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
