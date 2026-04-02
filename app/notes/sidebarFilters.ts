import type { NoteCatalogRow } from './types'
import {
  isDirectChildOfVaultFolder,
  isVaultRootNote,
  vaultTopLevelFolderNames,
} from './noteFilters'
import { catalogRowIsTrashed } from './trash'

export type TagFilterState = 'idle' | 'active' | 'pinned'

export type SidebarWorkspaceView =
  | { kind: 'inbox' }
  | { kind: 'tasks' }
  | { kind: 'favorites' }
  | { kind: 'trashed' }
  | { kind: 'folder'; folderName: string }
  | { kind: 'tags'; activeTags: string[]; pinnedTags: string[] }

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

export function tagFilterState(
  view: SidebarWorkspaceView,
  tag: string,
): TagFilterState {
  if (view.kind !== 'tags') {
    return 'idle'
  }

  if (view.pinnedTags.includes(tag)) {
    return 'pinned'
  }

  if (view.activeTags.includes(tag)) {
    return 'active'
  }

  return 'idle'
}

export function cycleTagState(state: TagFilterState): TagFilterState {
  if (state === 'idle') {
    return 'active'
  }

  if (state === 'active') {
    return 'pinned'
  }

  return 'idle'
}

export function selectedTagsFromView(view: SidebarWorkspaceView): string[] {
  if (view.kind !== 'tags') {
    return []
  }

  return [...view.activeTags, ...view.pinnedTags].sort((left, right) =>
    left.localeCompare(right),
  )
}

export function applyTagCycle(
  view: SidebarWorkspaceView,
  tag: string,
): SidebarWorkspaceView | null {
  const current = tagFilterState(view, tag)
  const next = cycleTagState(current)
  const pinned =
    view.kind === 'tags' ? view.pinnedTags.filter((t) => t !== tag) : []

  if (next === 'active') {
    return {
      kind: 'tags',
      activeTags: [tag],
      pinnedTags: pinned,
    }
  }

  if (next === 'pinned') {
    const active =
      view.kind === 'tags' ? view.activeTags.filter((t) => t !== tag) : []

    return {
      kind: 'tags',
      activeTags: active,
      pinnedTags: [...pinned, tag].sort((left, right) =>
        left.localeCompare(right),
      ),
    }
  }

  const active =
    view.kind === 'tags' ? view.activeTags.filter((t) => t !== tag) : []

  if (pinned.length === 0 && active.length === 0) {
    return null
  }

  return { kind: 'tags', activeTags: active, pinnedTags: pinned }
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
      isDirectChildOfVaultFolder(row.id, view.folderName) &&
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

export { vaultTopLevelFolderNames }
