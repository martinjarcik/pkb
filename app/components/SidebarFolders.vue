<script setup lang="ts">
const { topLevelFolders, foldersExpanded } = useSidebarNavigation()
</script>

<template>
  <section
    v-if="topLevelFolders.length > 0"
    data-testid="sidebar-folders"
    class="sidebar-folders-shell flex flex-col"
  >
    <SidebarFoldersControls />
    <SidebarFoldersActions v-if="foldersExpanded" />
  </section>
</template>
