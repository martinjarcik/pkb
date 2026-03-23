<script setup lang="ts">
const { loadNotes } = useNotes()

onMounted(() => {
  void loadNotes()
})
</script>

<template>
  <NotePanel />
</template>
