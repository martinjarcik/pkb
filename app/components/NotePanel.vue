<script setup lang="ts">
const { showNoteControls } = useNotes()
</script>

<template>
  <main
    data-testid="note-panel"
    class="flex h-full min-h-0 min-w-0 flex-col border-x border-border"
  >
    <NoteControls v-if="showNoteControls" />
    <NoteView />
  </main>
</template>
