import { loadConfig } from '~/config/loader'
import { LAYOUT_STATE_KEYS } from '~/composables/useLayout'

export default defineNuxtPlugin(() => {
  const defaultLayout = loadConfig().layout

  const { data } = useAppConfigDisk()

  const layout = data.value?.layout ?? defaultLayout

  useState(LAYOUT_STATE_KEYS.showSidebarPanel, () => layout.showSidebarPanel)
  useState(
    LAYOUT_STATE_KEYS.showInspectorPanel,
    () => layout.showInspectorPanel,
  )
  useState(
    LAYOUT_STATE_KEYS.showNotesListPanel,
    () => layout.showNotesListPanel,
  )
})
