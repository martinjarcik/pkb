<script setup lang="ts">
import type { AppConfig } from '~/config/loader'
import type { WorkspaceMeta } from '~/config/parseMeta'
import type { NoteCatalogRow } from '~/notes/types'
import { LAYOUT_STATE_KEYS } from '~/composables/useLayout'

type InitResponse = {
  config: AppConfig
  catalog: NoteCatalogRow[]
  folders: string[]
  meta: WorkspaceMeta
}

const { notes, loadError, loadNotes } = useNotes()
const { loadFolders, selectInbox } = useSidebarNavigation()
const { data: appConfigDisk } = useAppConfigDisk()
const { loadMeta, meta } = useFolderMeta()
const explicitFolders = useState<string[]>(
  'sidebarNavigation.explicitFolders',
  () => [],
)
const showSidebarPanel = useState<boolean>(
  LAYOUT_STATE_KEYS.showSidebarPanel,
  () => true,
)
const showInspectorPanel = useState<boolean>(
  LAYOUT_STATE_KEYS.showInspectorPanel,
  () => true,
)
const showNotesListPanel = useState<boolean>(
  LAYOUT_STATE_KEYS.showNotesListPanel,
  () => true,
)

onMounted(() => {
  void (async () => {
    try {
      const init = await $fetch<InitResponse>('/api/init')

      appConfigDisk.value = init.config
      notes.value = init.catalog
      explicitFolders.value = init.folders
      meta.value = init.meta
      loadError.value = null
      showSidebarPanel.value = init.config.layout.showSidebarPanel
      showInspectorPanel.value = init.config.layout.showInspectorPanel
      showNotesListPanel.value = init.config.layout.showNotesListPanel

      await selectInbox()
      return
    } catch {
      const loadFoldersPromise = loadFolders()
      const loadMetaPromise = loadMeta()

      await loadNotes()
      await selectInbox()
      await Promise.all([loadFoldersPromise, loadMetaPromise])
    }
  })()
})
</script>

<template>
  <NotePanel />
</template>
