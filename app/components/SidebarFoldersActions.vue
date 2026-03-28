<script setup lang="ts">
defineProps<{
  folderIcon: (name: string) => string | undefined
}>()

const emit = defineEmits<{
  'edit-folder': [folderName: string]
}>()

const { accentColor, selectedView, selectFolder, topLevelFolders } =
  useSidebarNavigation()

function handleEdit(folderName: string): void {
  emit('edit-folder', folderName)
}
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
      :custom-icon="folderIcon(folderName)"
      :selected="
        selectedView.kind === 'folder' && selectedView.folderName === folderName
      "
      :accent-color="accentColor"
      @click="selectFolder(folderName)"
      @edit="handleEdit(folderName)"
    />
  </div>
</template>
