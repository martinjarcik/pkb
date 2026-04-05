export type TagFilterState = 'idle' | 'selected' | 'excluded'

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
  | { kind: 'folder'; folderPath: string }
  | { kind: 'tags'; selectedTags: string[]; excludedTags: string[] }
