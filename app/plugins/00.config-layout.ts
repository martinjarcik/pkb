import { loadConfig, type AppConfig } from '~/config/loader'

export default defineNuxtPlugin(async () => {
  const defaultLayout = loadConfig().layout

  const { data } = await useAsyncData<AppConfig>(
    'app-config-disk',
    () => $fetch<AppConfig>('/api/app-config'),
    { default: () => loadConfig() },
  )

  const layout = data.value?.layout ?? defaultLayout

  useState('layout.showSidebarPanel', () => layout.showSidebarPanel)
  useState('layout.showInspectorPanel', () => layout.showInspectorPanel)
  useState('layout.showNotesListPanel', () => layout.showNotesListPanel)
})
