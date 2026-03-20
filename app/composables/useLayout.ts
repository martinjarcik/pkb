import { loadConfig } from '~/config/loader'

const defaultLayout = loadConfig().layout

export function useLayout() {
  const showInspector = useState(
    'layout.showInspector',
    () => defaultLayout.showInspector,
  )
  const showSidebar = useState(
    'layout.showSidebar',
    () => defaultLayout.showSidebar,
  )
  const showNoteList = useState(
    'layout.showNoteList',
    () => defaultLayout.showNoteList,
  )

  return {
    showInspector,
    showSidebar,
    showNoteList,
  }
}
