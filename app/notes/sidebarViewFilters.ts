import { isDirectChildOfFolder, isVaultRootNote } from './noteFilters'
import { catalogRowIsTrashed } from './trash'
import type { NoteCatalogRow } from './types'
import type { SidebarWorkspaceView } from './sidebarViewTypes'
import { selectedTagsFromView } from './tagFilterMachine'

function rowTags(row: NoteCatalogRow): string[] {
  if (!Array.isArray(row.tags)) {
    return []
  }

  return row.tags.filter((tag): tag is string => typeof tag === 'string')
}

function rowHasTasks(row: NoteCatalogRow): boolean {
  return row.hasTasks === true
}

export function allTagsFromCatalog(rows: readonly NoteCatalogRow[]): string[] {
  return [...new Set(rows.flatMap((row) => rowTags(row)))].sort((left, right) =>
    left.localeCompare(right),
  )
}

export function filterCatalogBySelectedTags(
  rows: readonly NoteCatalogRow[],
  selectedTags: readonly string[],
): readonly NoteCatalogRow[] {
  if (selectedTags.length === 0) {
    return rows
  }

  return rows.filter((row) => {
    const tags = new Set(rowTags(row))
    return selectedTags.every((tag) => tags.has(tag))
  })
}

export function filterCatalogByHasTasks(
  rows: readonly NoteCatalogRow[],
): readonly NoteCatalogRow[] {
  return rows.filter((row) => rowHasTasks(row))
}

export function mergeTopLevelFolders(
  catalogDerived: string[],
  explicit: string[],
): string[] {
  return [...new Set([...catalogDerived, ...explicit])].sort((left, right) =>
    left.localeCompare(right),
  )
}

export function filterCatalogForSidebarView(
  rows: readonly NoteCatalogRow[],
  view: SidebarWorkspaceView,
): readonly NoteCatalogRow[] {
  if (view.kind === 'search') {
    return rows
  }

  if (view.kind === 'inbox') {
    return rows.filter(
      (row) => isVaultRootNote(row.id) && !catalogRowIsTrashed(row),
    )
  }

  if (view.kind === 'tags') {
    return filterCatalogBySelectedTags(
      rows.filter((row) => !catalogRowIsTrashed(row)),
      selectedTagsFromView(view),
    )
  }

  if (view.kind === 'tasks') {
    return filterCatalogByHasTasks(
      rows.filter((row) => !catalogRowIsTrashed(row)),
    )
  }

  if (view.kind === 'favorites') {
    return rows.filter(
      (row) => row.favorite === true && !catalogRowIsTrashed(row),
    )
  }

  if (view.kind === 'trashed') {
    return rows.filter((row) => catalogRowIsTrashed(row))
  }

  return rows.filter(
    (row) =>
      isDirectChildOfFolder(row.id, view.folderPath) &&
      !catalogRowIsTrashed(row),
  )
}

export function sortCatalogRowsPinnedFirstByModifiedAt(
  rows: readonly NoteCatalogRow[],
): NoteCatalogRow[] {
  return [...rows].sort((a, b) => {
    const pinnedA = a.pinned === true ? 1 : 0
    const pinnedB = b.pinned === true ? 1 : 0

    if (pinnedA !== pinnedB) {
      return pinnedB - pinnedA
    }

    return b.modifiedAt.localeCompare(a.modifiedAt)
  })
}

export function orderedCatalogRowsForSidebarView(
  rows: readonly NoteCatalogRow[],
  view: SidebarWorkspaceView,
): NoteCatalogRow[] {
  return sortCatalogRowsPinnedFirstByModifiedAt(
    filterCatalogForSidebarView(rows, view),
  )
}
