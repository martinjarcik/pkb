<script setup lang="ts">
const { loadNotes, selectNoteById } = useNotes()
const { visibleCatalogRows } = useSidebarNavigation()

onMounted(() => {
  void (async () => {
    await loadNotes()
    await selectNoteById(visibleCatalogRows.value[0]?.id ?? null)
  })()
})
</script>

<template>
  <NotePanel />
</template>
