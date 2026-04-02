<script setup lang="ts">
const { showNoteControls } = useNotes()
</script>

<template>
  <main
    data-testid="note-panel"
    class="flex h-full min-h-0 min-w-0 flex-col border-x border-border"
  >
    <NoteControls v-if="showNoteControls" />
    <div data-testid="note-view" class="flex min-h-0 min-w-0 flex-1 flex-col">
      <NoteTemplate />
    </div>
  </main>
</template>
