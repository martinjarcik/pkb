<script setup lang="ts">
const { loadNotes, selectNoteById } = useNotes()
const { visibleCatalogRows, loadFolders } = useSidebarNavigation()

onMounted(() => {
  void (async () => {
    await Promise.all([loadNotes(), loadFolders()])
    await selectNoteById(visibleCatalogRows.value[0]?.id ?? null)
  })()
})
</script>

<template>
  <NotePanel />
</template>
