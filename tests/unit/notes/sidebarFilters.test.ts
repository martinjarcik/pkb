import { describe, expect, it } from 'vitest'
import type { Note, NoteCatalogRow } from '~/notes/types'
import {
  activeTagsFromView,
  allTagsFromCatalog,
  applyTagCycle,
  cycleTagState,
  filterCatalogByTags,
  filterCatalogForSidebarView,
  filterNotesWithTasks,
  mergeTopLevelFolders,
  orderedCatalogRowsForSidebarView,
  sortCatalogRowsPinnedFirstByModifiedAt,
  type SidebarWorkspaceView,
} from '~/notes/sidebarFilters'

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

function createNote(id: string, content: string): Note {
  return {
    id,
    content,
    createdAt: '2026-03-20T00:00:00.000Z',
    modifiedAt: '2026-03-20T00:00:00.000Z',
    title: id,
    description: '',
  }
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

describe('filterCatalogByTags', () => {
  it('filters notes by selected tags using AND logic', () => {
    const rows = [
      createCatalogRow('a.md', ['engineering', 'idea']),
      createCatalogRow('b.md', ['engineering', 'dream']),
      createCatalogRow('c.md', ['idea']),
    ]

    expect(
      filterCatalogByTags(rows, ['engineering', 'idea'], []).map(
        (row) => row.id,
      ),
    ).toEqual(['a.md'])
  })

  it('excludes notes that have any excluded tag', () => {
    const rows = [
      createCatalogRow('a.md', ['engineering', 'idea']),
      createCatalogRow('b.md', ['engineering', 'dream']),
      createCatalogRow('c.md', ['idea']),
    ]

    expect(
      filterCatalogByTags(rows, [], ['engineering']).map((row) => row.id),
    ).toEqual(['c.md'])
  })

  it('combines selected and excluded tags', () => {
    const rows = [
      createCatalogRow('a.md', ['engineering', 'idea']),
      createCatalogRow('b.md', ['engineering', 'dream']),
      createCatalogRow('c.md', ['idea']),
    ]

    expect(
      filterCatalogByTags(rows, ['idea'], ['engineering']).map((row) => row.id),
    ).toEqual(['c.md'])
  })

  it('returns all rows when no tags are specified', () => {
    const rows = [
      createCatalogRow('a.md', ['engineering']),
      createCatalogRow('b.md', ['idea']),
    ]

    expect(filterCatalogByTags(rows, [], []).map((row) => row.id)).toEqual([
      'a.md',
      'b.md',
    ])
  })
})

describe('filterNotesWithTasks', () => {
  it('returns only notes with unchecked checklist items', () => {
    const notes = [
      createNote('a.md', 'regular note'),
      createNote('b.md', '- [ ] todo'),
      createNote('c.md', '- [x] done'),
    ]

    expect(filterNotesWithTasks(notes).map((row) => row.id)).toEqual(['b.md'])
  })

  it('excludes trashed notes with unchecked checklist items', () => {
    const notes = [
      createNote('task.md', '- [ ] todo'),
      {
        ...createNote('trashed-task.md', '- [ ] todo'),
        trashedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    expect(filterNotesWithTasks(notes).map((row) => row.id)).toEqual([
      'task.md',
    ])
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
  it('returns selected for an idle tag', () => {
    expect(cycleTagState('idle')).toBe('selected')
  })

  it('returns excluded for a selected tag', () => {
    expect(cycleTagState('selected')).toBe('excluded')
  })

  it('returns idle for an excluded tag', () => {
    expect(cycleTagState('excluded')).toBe('idle')
  })
})

describe('applyTagCycle', () => {
  it('selecting an idle tag adds it to selectedTags', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      selectedTags: ['idea'],
      excludedTags: [],
    }

    expect(applyTagCycle(view, 'engineering')).toEqual({
      kind: 'tags',
      selectedTags: ['engineering', 'idea'],
      excludedTags: [],
    })
  })

  it('excluding a selected tag moves it to excludedTags', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      selectedTags: ['engineering'],
      excludedTags: [],
    }

    expect(applyTagCycle(view, 'engineering')).toEqual({
      kind: 'tags',
      selectedTags: [],
      excludedTags: ['engineering'],
    })
  })

  it('deselecting an excluded tag removes it', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      selectedTags: ['idea'],
      excludedTags: ['engineering'],
    }

    expect(applyTagCycle(view, 'engineering')).toEqual({
      kind: 'tags',
      selectedTags: ['idea'],
      excludedTags: [],
    })
  })

  it('returns null when no tags remain', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      selectedTags: [],
      excludedTags: ['engineering'],
    }

    expect(applyTagCycle(view, 'engineering')).toBeNull()
  })

  it('selecting from inbox view creates a tags view', () => {
    const view: SidebarWorkspaceView = { kind: 'inbox' }

    expect(applyTagCycle(view, 'engineering')).toEqual({
      kind: 'tags',
      selectedTags: ['engineering'],
      excludedTags: [],
    })
  })

  it('preserves other selected tags when excluding one', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      selectedTags: ['dream', 'engineering'],
      excludedTags: [],
    }

    expect(applyTagCycle(view, 'engineering')).toEqual({
      kind: 'tags',
      selectedTags: ['dream'],
      excludedTags: ['engineering'],
    })
  })

  it('preserves excluded tags when selecting a new tag', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      selectedTags: [],
      excludedTags: ['dream'],
    }

    expect(applyTagCycle(view, 'engineering')).toEqual({
      kind: 'tags',
      selectedTags: ['engineering'],
      excludedTags: ['dream'],
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

describe('activeTagsFromView', () => {
  it('returns sorted selectedTags from a tags view', () => {
    const view: SidebarWorkspaceView = {
      kind: 'tags',
      selectedTags: ['idea', 'engineering'],
      excludedTags: ['dream'],
    }

    expect(activeTagsFromView(view)).toEqual(['engineering', 'idea'])
  })

  it('returns empty array for non-tags views', () => {
    expect(activeTagsFromView({ kind: 'inbox' })).toEqual([])
  })
})
