import { loadConfig } from '~/config/loader'

const defaultLayout = loadConfig().layout
const defaultFeatures = loadConfig().features

type LayoutVisibilitySnapshot = {
  showInspectorPanel: boolean
  showNotesListPanel: boolean
  showSidebarPanel: boolean
}

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

  const nonDistractionMode = useState('layout.nonDistractionMode', () => false)
  const nonDistractionSnapshot = useState<LayoutVisibilitySnapshot | null>(
    'layout.nonDistractionSnapshot',
    () => null,
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

  function toggleNonDistractionMode(): void {
    if (nonDistractionMode.value) {
      const snapshot = nonDistractionSnapshot.value
      if (snapshot) {
        showInspectorPanel.value = snapshot.showInspectorPanel
        showNotesListPanel.value = snapshot.showNotesListPanel
        showSidebarPanel.value = snapshot.showSidebarPanel
      }
      nonDistractionSnapshot.value = null
      nonDistractionMode.value = false
      return
    }

    nonDistractionSnapshot.value = {
      showInspectorPanel: showInspectorPanel.value,
      showNotesListPanel: showNotesListPanel.value,
      showSidebarPanel: showSidebarPanel.value,
    }
    showInspectorPanel.value = false
    showNotesListPanel.value = false
    showSidebarPanel.value = false
    nonDistractionMode.value = true
  }

  return {
    nonDistractionMode,
    showInspectorPanel,
    showSidebarPanel,
    showNotesListPanel,
    toggleInspectorPanel,
    toggleNonDistractionMode,
    toggleSidebarPanel,
  }
}

export function useAppFeatures() {
  return {
    favorites: defaultFeatures.favorites,
    tasks: defaultFeatures.tasks,
    pinned: defaultFeatures.pinned,
    nonDistractionMode: defaultFeatures.nonDistractionMode,
    noteWebhook: defaultFeatures.noteWebhook,
  }
}
