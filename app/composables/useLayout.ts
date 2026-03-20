import type { AppConfig } from '~/config/loader'
import { loadConfig } from '~/config/loader'

export type LayoutState = {
  showInspector: boolean
  showSidebar: boolean
  showNoteList: boolean
}

export function createLayoutState(layout: AppConfig['layout']): LayoutState {
  return {
    showInspector: layout.showInspector,
    showSidebar: layout.showSidebar,
    showNoteList: layout.showNoteList,
  }
}

export function useLayout() {
  const defaults = createLayoutState(loadConfig().layout)

  const showInspector = useState(
    'layout.showInspector',
    () => defaults.showInspector,
  )
  const showSidebar = useState('layout.showSidebar', () => defaults.showSidebar)
  const showNoteList = useState(
    'layout.showNoteList',
    () => defaults.showNoteList,
  )

  return {
    showInspector,
    showSidebar,
    showNoteList,
  }
}
