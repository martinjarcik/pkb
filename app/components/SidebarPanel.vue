<script setup lang="ts">
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'

const { allTags } = useSidebarNavigation()
</script>

<template>
  <aside
    data-testid="sidebar-panel"
    data-tauri-drag-region
    class="sidebar-panel-shell flex h-full flex-col"
  >
    <SidebarNavigation />
    <div aria-hidden="true" class="h-[30px] shrink-0" />
    <SidebarFolders />

    <template v-if="allTags.length > 0">
      <SidebarTags />
    </template>
  </aside>
</template>
