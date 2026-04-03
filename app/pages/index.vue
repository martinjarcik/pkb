<script setup lang="ts">
const { startApp } = useAppStartup()

onMounted(() => {
  void startApp()
})
</script>

<template>
  <NotePanel />
</template>
