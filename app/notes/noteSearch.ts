import type { Note, NoteCatalogRow } from './types'
import { sortCatalogRowsPinnedFirstByModifiedAt } from './sidebarViewFilters'

function normalizeSearchQuery(query: string): string {
  return query.trim().toLocaleLowerCase()
}

function noteMatchesQuery(note: Note, normalizedQuery: string): boolean {
  return (
    note.title.toLocaleLowerCase().includes(normalizedQuery) ||
    note.content.toLocaleLowerCase().includes(normalizedQuery)
  )
}

export function filterOrderedCatalogRowsByIds(
  rows: readonly NoteCatalogRow[],
  matchingIds: readonly string[],
): NoteCatalogRow[] {
  if (matchingIds.length === 0) {
    return []
  }

  const matchingIdSet = new Set(matchingIds)

  return sortCatalogRowsPinnedFirstByModifiedAt(
    rows.filter((row) => matchingIdSet.has(row.id)),
  )
}

export function searchNotes(notes: readonly Note[], query: string): string[] {
  const normalizedQuery = normalizeSearchQuery(query)

  if (normalizedQuery.length === 0) {
    return []
  }

  return notes
    .filter((note) => noteMatchesQuery(note, normalizedQuery))
    .map((note) => note.id)
}
