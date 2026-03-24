<script setup lang="ts">
const { notes } = useNotes()

const noteContent = computed(() => notes.value[0]?.content ?? '')
</script>

<template>
  <div
    data-testid="note-template"
    class="note-template-shell flex min-h-0 min-w-0 flex-1 flex-col"
  >
    <NoteEditor :content="noteContent" />
  </div>
</template>
