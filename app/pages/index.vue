<script setup lang="ts">
const { loadNotes } = useNotes()
const { loadFolders, selectInbox } = useSidebarNavigation()

onMounted(() => {
  void (async () => {
    const loadFoldersPromise = loadFolders()

    await loadNotes()
    await selectInbox()
    await loadFoldersPromise
  })()
})
</script>

<template>
  <NotePanel />
</template>
