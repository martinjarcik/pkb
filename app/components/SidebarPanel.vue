<script setup lang="ts">
const { topLevelFolders } = useSidebarNavigation()
</script>

<template>
  <aside
    data-testid="sidebar-panel"
    class="sidebar-panel-shell flex h-full flex-col"
  >
    <SidebarNavigation />
    <template v-if="topLevelFolders.length > 0">
      <div aria-hidden="true" class="h-[30px] shrink-0" />
      <SidebarFoldersActions />
    </template>
  </aside>
</template>
