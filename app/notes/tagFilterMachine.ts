import type {
  SidebarNonSearchView,
  SidebarWorkspaceView,
  TagFilterState,
} from './sidebarViewTypes'

export function tagFilterState(
  view: SidebarWorkspaceView,
  tag: string,
): TagFilterState {
  if (view.kind !== 'tags') {
    return 'idle'
  }

  if (view.excludedTags.includes(tag)) {
    return 'excluded'
  }

  if (view.selectedTags.includes(tag)) {
    return 'selected'
  }

  return 'idle'
}

export function cycleTagState(state: TagFilterState): TagFilterState {
  if (state === 'idle') {
    return 'selected'
  }

  if (state === 'selected') {
    return 'excluded'
  }

  return 'idle'
}

export function activeTagsFromView(view: SidebarWorkspaceView): string[] {
  if (view.kind !== 'tags') {
    return []
  }

  return [...view.selectedTags].sort((left, right) => left.localeCompare(right))
}

export function applyTagCycle(
  view: SidebarWorkspaceView,
  tag: string,
): SidebarNonSearchView | null {
  const current = tagFilterState(view, tag)
  const next = cycleTagState(current)

  const selected =
    view.kind === 'tags' ? view.selectedTags.filter((t) => t !== tag) : []
  const excluded =
    view.kind === 'tags' ? view.excludedTags.filter((t) => t !== tag) : []

  if (next === 'selected') {
    return {
      kind: 'tags',
      selectedTags: [...selected, tag].sort((left, right) =>
        left.localeCompare(right),
      ),
      excludedTags: excluded,
    }
  }

  if (next === 'excluded') {
    return {
      kind: 'tags',
      selectedTags: selected,
      excludedTags: [...excluded, tag].sort((left, right) =>
        left.localeCompare(right),
      ),
    }
  }

  if (selected.length === 0 && excluded.length === 0) {
    return null
  }

  return { kind: 'tags', selectedTags: selected, excludedTags: excluded }
}
