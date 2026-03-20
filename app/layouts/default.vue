<script setup lang="ts">
const { showInspector, showSidebar, showNoteList } = useLayout()
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background text-foreground">
    <Sidebar v-if="showSidebar" class="w-14 shrink-0" />
    <NoteList v-if="showNoteList" class="w-72 shrink-0" />

    <div class="min-w-0 flex-1">
      <slot />
    </div>

    <Inspector v-if="showInspector" class="w-80 shrink-0" />
  </div>
</template>
