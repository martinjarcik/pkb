<script setup lang="ts">
import { orderedCatalogRowsForSidebarView } from '~/composables/useSidebarNavigation'

const { loadNotes, notes, selectNoteById } = useNotes()
const { loadFolders } = useSidebarNavigation()

onMounted(() => {
  void (async () => {
    const loadFoldersPromise = loadFolders()

    await loadNotes()
    await selectNoteById(
      orderedCatalogRowsForSidebarView(notes.value, { kind: 'inbox' })[0]?.id ??
        null,
    )
    await loadFoldersPromise
  })()
})
</script>

<template>
  <NotePanel />
</template>
