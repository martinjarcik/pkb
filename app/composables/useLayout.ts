import { ref } from 'vue'
import { loadConfig } from '~/config/loader'
import type { AppConfig } from '~/config/parseAppConfig'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'

const defaultLayout = loadConfig().layout
type LayoutVisibilitySnapshot = {
  showInspectorPanel: boolean
  showNotesListPanel: boolean
  showSidebarPanel: boolean
}

const showInspectorPanel = ref(defaultLayout.showInspectorPanel)
const showSidebarPanel = ref(defaultLayout.showSidebarPanel)
const showNotesListPanel = ref(defaultLayout.showNotesListPanel)
const nonDistractionMode = ref(false)
const nonDistractionSnapshot = ref<LayoutVisibilitySnapshot | null>(null)

export function useLayout() {
  const { saveAppConfigPatch } = useAppConfigDisk()

  function persistAppConfigPatch(patch: Record<string, unknown>): void {
    saveAppConfigPatch(patch).catch((error: unknown) => {
      console.error('Failed to persist app config:', error)
    })
  }

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
