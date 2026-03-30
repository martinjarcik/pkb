import { loadConfig } from '~/config/loader'

export default defineNuxtPlugin(async () => {
  const defaultLayout = loadConfig().layout

  const { data } = await useAppConfigDisk()

  const layout = data.value?.layout ?? defaultLayout

  useState('layout.showSidebarPanel', () => layout.showSidebarPanel)
  useState('layout.showInspectorPanel', () => layout.showInspectorPanel)
  useState('layout.showNotesListPanel', () => layout.showNotesListPanel)
})
