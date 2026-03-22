<script setup lang="ts">
const { showInspectorPanel, showSidebarPanel, showNotesListPanel } = useLayout()
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background text-foreground">
    <SidebarPanel v-if="showSidebarPanel" class="w-14 shrink-0" />
    <NotesListPanel v-if="showNotesListPanel" class="w-72 shrink-0" />

    <div class="min-w-0 flex-1">
      <slot />
    </div>

    <InspectorPanel v-if="showInspectorPanel" class="w-80 shrink-0" />
  </div>
</template>
