import { useState } from '#app'
import { loadConfig, type AppConfig } from '~/config/loader'

const defaultLayout = loadConfig().layout
export const LAYOUT_STATE_KEYS = {
  showInspectorPanel: 'layout.showInspectorPanel',
  showSidebarPanel: 'layout.showSidebarPanel',
  showNotesListPanel: 'layout.showNotesListPanel',
  nonDistractionMode: 'layout.nonDistractionMode',
  nonDistractionSnapshot: 'layout.nonDistractionSnapshot',
} as const

type LayoutVisibilitySnapshot = {
  showInspectorPanel: boolean
  showNotesListPanel: boolean
  showSidebarPanel: boolean
}

export function useLayout() {
  const { saveAppConfigPatch } = useAppConfigDisk()

  function persistAppConfigPatch(patch: Record<string, unknown>): void {
    saveAppConfigPatch(patch).catch((error: unknown) => {
      console.error('Failed to persist app config:', error)
    })
  }

  const showInspectorPanel = useState(
    LAYOUT_STATE_KEYS.showInspectorPanel,
    () => defaultLayout.showInspectorPanel,
  )
  const showSidebarPanel = useState(
    LAYOUT_STATE_KEYS.showSidebarPanel,
    () => defaultLayout.showSidebarPanel,
  )
  const showNotesListPanel = useState(
    LAYOUT_STATE_KEYS.showNotesListPanel,
    () => defaultLayout.showNotesListPanel,
  )

  const nonDistractionMode = useState(
    LAYOUT_STATE_KEYS.nonDistractionMode,
    () => false,
  )
  const nonDistractionSnapshot = useState<LayoutVisibilitySnapshot | null>(
    LAYOUT_STATE_KEYS.nonDistractionSnapshot,
    () => null,
  )

  function syncLayoutFromConfig(layout: AppConfig['layout']): void {
    showInspectorPanel.value = layout.showInspectorPanel
    showSidebarPanel.value = layout.showSidebarPanel
    showNotesListPanel.value = layout.showNotesListPanel
  }

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
    syncLayoutFromConfig,
    toggleInspectorPanel,
    toggleNonDistractionMode,
    toggleSidebarPanel,
  }
}
