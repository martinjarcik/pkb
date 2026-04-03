<script setup lang="ts">
import { LAYOUT_STATE_KEYS } from '~/composables/useLayout'

const { loadError, loadNotes } = useNotes()
const { loadFolders, selectInbox } = useSidebarNavigation()
const { data: appConfigDisk, loadAppConfigDisk } = useAppConfigDisk()
const { loadMeta } = useFolderMeta()
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
      await loadAppConfigDisk()
      showSidebarPanel.value = appConfigDisk.value.layout.showSidebarPanel
      showInspectorPanel.value = appConfigDisk.value.layout.showInspectorPanel
      showNotesListPanel.value = appConfigDisk.value.layout.showNotesListPanel

      await Promise.all([loadNotes(), loadFolders(), loadMeta()])
      loadError.value = null
    } catch {
      await loadNotes()
      await Promise.all([loadFolders(), loadMeta()])
    }

    await selectInbox()
  })()
})
</script>

<template>
  <NotePanel />
</template>
