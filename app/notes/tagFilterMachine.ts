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
): SidebarNonSearchView | null {
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
