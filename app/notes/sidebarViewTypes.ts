export type TagFilterState = 'idle' | 'active' | 'pinned'

export type SidebarWorkspaceView =
  | SidebarNonSearchView
  | {
      kind: 'search'
      query: string
      matchingIds: string[]
      previousView: SidebarNonSearchView
    }

export type SidebarNonSearchView =
  | { kind: 'inbox' }
  | { kind: 'tasks' }
  | { kind: 'favorites' }
  | { kind: 'trashed' }
  | { kind: 'folder'; folderName: string }
  | { kind: 'tags'; activeTags: string[]; pinnedTags: string[] }
