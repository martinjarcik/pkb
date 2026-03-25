<script setup lang="ts">
const { loadNotes, selectNoteById } = useNotes()
const { visibleListItems } = useSidebarNavigation()

onMounted(() => {
  void (async () => {
    await loadNotes()
    await selectNoteById(visibleListItems.value[0]?.id ?? null)
  })()
})
</script>

<template>
  <NotePanel />
</template>
