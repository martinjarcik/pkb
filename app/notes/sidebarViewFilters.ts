import { isDirectChildOfFolder, isVaultRootNote } from './noteFilters'
import { catalogRowIsTrashed } from './trash'
import type { Note, NoteCatalogRow } from './types'
import type { SidebarWorkspaceView } from './sidebarViewTypes'
import { selectedTagsFromView } from './tagFilterMachine'

const UNCHECKED_TASK_ITEM = /^\s*[-*+]\s+\[ \]\s+/mu

function rowTags(row: NoteCatalogRow): string[] {
  if (!Array.isArray(row.tags)) {
    return []
  }

  return row.tags.filter((tag): tag is string => typeof tag === 'string')
}

function noteHasTasks(note: Note): boolean {
  return UNCHECKED_TASK_ITEM.test(note.content)
}

function projectCatalogRow(note: Note): NoteCatalogRow {
  const { content: _content, ...row } = note
  return row
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

export function filterNotesWithTasks(
  notes: readonly Note[],
): readonly NoteCatalogRow[] {
  return notes
    .filter((note) => !catalogRowIsTrashed(note) && noteHasTasks(note))
    .map(projectCatalogRow)
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
    return []
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
