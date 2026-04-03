import type { NoteCatalogRow } from './types'
import { sortCatalogRowsPinnedFirstByModifiedAt } from './sidebarFilters'

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
