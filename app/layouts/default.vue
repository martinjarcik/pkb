<script setup lang="ts">
const { showInspectorPanel, showSidebarPanel, showNotesListPanel } = useLayout()
</script>

<template>
  <div class="flex h-screen overflow-hidden text-foreground">
    <SidebarPanel
      v-show="showSidebarPanel"
      class="app-shell-sidebar shrink-0"
    />
    <NotesListPanel
      v-show="showNotesListPanel"
      class="app-shell-notes-list shrink-0"
    />

    <div class="min-w-0 flex-1">
      <slot />
    </div>

    <InspectorPanel
      v-show="showInspectorPanel"
      class="app-shell-inspector shrink-0"
    />
  </div>
</template>
