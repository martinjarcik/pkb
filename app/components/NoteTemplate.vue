<script setup lang="ts">
const { selectedNote } = useNotes()
</script>

<template>
  <div
    data-testid="note-template"
    class="note-template-shell flex min-h-0 min-w-0 flex-1 flex-col"
  >
    <NoteEditor :content="selectedNote?.content ?? ''" />
  </div>
</template>
