<script setup lang="ts">
const { accentColor, selectedView, selectFolder, topLevelFolders } =
  useSidebarNavigation()
</script>

<template>
  <div
    v-if="topLevelFolders.length > 0"
    data-testid="sidebar-folders-actions"
    class="flex flex-col"
  >
    <SidebarFolderItem
      v-for="folderName in topLevelFolders"
      :key="folderName"
      :folder-name="folderName"
      :selected="
        selectedView.kind === 'folder' && selectedView.folderName === folderName
      "
      :accent-color="accentColor"
      @click="selectFolder(folderName)"
    />
  </div>
</template>
