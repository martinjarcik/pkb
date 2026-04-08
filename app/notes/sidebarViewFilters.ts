import { extractTagsFromMarkdown } from './extractTags'
import { isDirectChildOfFolder, isVaultRootNote } from './noteFilters'
import { catalogRowIsTrashed } from './trash'
import type { Note, NoteCatalogRow } from './types'
import type { SidebarWorkspaceView } from './sidebarViewTypes'

const UNCHECKED_TASK_ITEM = /^\s*[-*+]\s+\[ \]\s+/mu

function noteTags(note: Note): string[] {
  return extractTagsFromMarkdown(note.content)
}

function noteHasTasks(note: Note): boolean {
  return UNCHECKED_TASK_ITEM.test(note.content)
}

function projectCatalogRow(note: Note): NoteCatalogRow {
  const { content: _content, ...row } = note
  return row
}

export function allTagsFromNotes(notes: readonly Note[]): string[] {
  return [...new Set(notes.flatMap((note) => noteTags(note)))].sort(
    (left, right) => left.localeCompare(right),
  )
}

export function filterNotesByTags(
  notes: readonly Note[],
  selectedTags: readonly string[],
  excludedTags: readonly string[],
): readonly NoteCatalogRow[] {
  if (selectedTags.length === 0 && excludedTags.length === 0) {
    return notes.map(projectCatalogRow)
  }

  return notes
    .filter((note) => {
      const tags = new Set(noteTags(note))
      const hasAllSelected = selectedTags.every((tag) => tags.has(tag))
      const hasNoExcluded = excludedTags.every((tag) => !tags.has(tag))
      return hasAllSelected && hasNoExcluded
    })
    .map(projectCatalogRow)
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
    return rows.filter((row) => !catalogRowIsTrashed(row))
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
