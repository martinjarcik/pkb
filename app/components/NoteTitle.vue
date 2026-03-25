<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <h1 data-testid="note-title" class="note-title-shell">
    {{ title }}
  </h1>
</template>
