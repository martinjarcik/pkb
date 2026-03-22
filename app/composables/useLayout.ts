import { loadConfig } from '~/config/loader'

const defaultLayout = loadConfig().layout

export function useLayout() {
  const showInspectorPanel = useState(
    'layout.showInspectorPanel',
    () => defaultLayout.showInspectorPanel,
  )
  const showSidebarPanel = useState(
    'layout.showSidebarPanel',
    () => defaultLayout.showSidebarPanel,
  )
  const showNotesListPanel = useState(
    'layout.showNotesListPanel',
    () => defaultLayout.showNotesListPanel,
  )

  return {
    showInspectorPanel,
    showSidebarPanel,
    showNotesListPanel,
  }
}
