import { loadConfig } from '~/config/loader'

const defaultLayout = loadConfig().layout

export function persistAppConfigPatch(patch: Record<string, unknown>): void {
  $fetch('/api/app-config', {
    method: 'PUT',
    body: patch,
  }).catch((error: unknown) => {
    console.error('Failed to persist app config:', error)
  })
}

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

  function toggleSidebarPanel(): void {
    const next = !showSidebarPanel.value
    showSidebarPanel.value = next
    persistAppConfigPatch({ layout: { showSidebarPanel: next } })
  }

  function toggleInspectorPanel(): void {
    const next = !showInspectorPanel.value
    showInspectorPanel.value = next
    persistAppConfigPatch({ layout: { showInspectorPanel: next } })
  }

  return {
    showInspectorPanel,
    showSidebarPanel,
    showNotesListPanel,
    toggleInspectorPanel,
    toggleSidebarPanel,
  }
}
