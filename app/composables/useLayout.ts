import { ref } from 'vue'
import { loadConfig } from '~/config/loader'
import type { AppConfig } from '~/config/parseAppConfig'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'

const defaultLayout = loadConfig().layout
type LayoutVisibilitySnapshot = {
  showNotesListPanel: boolean
  showSidebarPanel: boolean
}

const showSidebarPanel = ref(defaultLayout.showSidebarPanel)
const showNotesListPanel = ref(defaultLayout.showNotesListPanel)
const sidebarPanelWidth = ref(defaultLayout.sidebarPanelWidth)
const notesListPanelWidth = ref(defaultLayout.notesListPanelWidth)
const nonDistractionMode = ref(false)
const nonDistractionSnapshot = ref<LayoutVisibilitySnapshot | null>(null)

/** Owns shared layout visibility plus session-only non-distraction mode. */
export function useLayout() {
  const { saveAppConfigPatch } = useAppConfigDisk()

  function persistAppConfigPatch(patch: Record<string, unknown>): void {
    saveAppConfigPatch(patch).catch((error: unknown) => {
      console.error('Failed to persist app config:', error)
    })
  }

  function syncLayoutFromConfig(layout: AppConfig['layout']): void {
    showSidebarPanel.value = layout.showSidebarPanel
    showNotesListPanel.value = layout.showNotesListPanel
    sidebarPanelWidth.value = layout.sidebarPanelWidth
    notesListPanelWidth.value = layout.notesListPanelWidth
  }

  function toggleSidebarPanel(): void {
    const next = !showSidebarPanel.value
    showSidebarPanel.value = next
    persistAppConfigPatch({ layout: { showSidebarPanel: next } })
  }

  function toggleNonDistractionMode(): void {
    if (nonDistractionMode.value) {
      const snapshot = nonDistractionSnapshot.value
      if (snapshot) {
        showNotesListPanel.value = snapshot.showNotesListPanel
        showSidebarPanel.value = snapshot.showSidebarPanel
      }
      nonDistractionSnapshot.value = null
      nonDistractionMode.value = false
      return
    }

    nonDistractionSnapshot.value = {
      showNotesListPanel: showNotesListPanel.value,
      showSidebarPanel: showSidebarPanel.value,
    }
    showNotesListPanel.value = false
    showSidebarPanel.value = false
    nonDistractionMode.value = true
  }

  function setSidebarPanelWidth(width: number): void {
    sidebarPanelWidth.value = width
  }

  function setNotesListPanelWidth(width: number): void {
    notesListPanelWidth.value = width
  }

  function persistSidebarPanelWidth(width: number): void {
    persistAppConfigPatch({ layout: { sidebarPanelWidth: width } })
  }

  function persistNotesListPanelWidth(width: number): void {
    persistAppConfigPatch({ layout: { notesListPanelWidth: width } })
  }

  return {
    nonDistractionMode,
    notesListPanelWidth,
    persistNotesListPanelWidth,
    persistSidebarPanelWidth,
    showSidebarPanel,
    showNotesListPanel,
    sidebarPanelWidth,
    setNotesListPanelWidth,
    setSidebarPanelWidth,
    syncLayoutFromConfig,
    toggleNonDistractionMode,
    toggleSidebarPanel,
  }
}
