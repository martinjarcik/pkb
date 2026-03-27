<script setup lang="ts">
const { topLevelFolders, foldersExpanded } = useSidebarNavigation()
</script>

<template>
  <section
    data-testid="sidebar-folders"
    class="sidebar-folders-shell flex flex-col"
  >
    <SidebarFoldersControls />
    <SidebarFoldersActions
      v-if="foldersExpanded && topLevelFolders.length > 0"
    />
  </section>
</template>
