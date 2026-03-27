<script setup lang="ts">
const { loadNotes, selectNoteById } = useNotes()
const { visibleCatalogRows, loadFolders } = useSidebarNavigation()

onMounted(() => {
  void (async () => {
    const loadFoldersPromise = loadFolders()

    await loadNotes()
    await selectNoteById(visibleCatalogRows.value[0]?.id ?? null)
    await loadFoldersPromise
  })()
})
</script>

<template>
  <NotePanel />
</template>
