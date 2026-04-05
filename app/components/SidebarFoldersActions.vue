<script setup lang="ts">
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'
import { folderDisplayName } from '~/notes/folderTree'
import type { FolderTreeNode } from '~/notes/folderTree'

defineProps<{
  folderIcon: (path: string) => string | undefined
}>()

const emit = defineEmits<{
  'edit-folder': [folderPath: string]
  'create-subfolder': [parentPath: string]
}>()

const {
  accentColor,
  selectedView,
  selectFolder,
  folderTree,
  isFolderExpanded,
  toggleFolderExpanded,
} = useSidebarNavigation()

function handleEdit(folderPath: string): void {
  emit('edit-folder', folderPath)
}

function handleCreateSubfolder(parentPath: string): void {
  emit('create-subfolder', parentPath)
}

function isSelected(folderPath: string): boolean {
  return (
    selectedView.value.kind === 'folder' &&
    selectedView.value.folderPath === folderPath
  )
}

function renderNodes(nodes: FolderTreeNode[]): FolderTreeNode[] {
  return nodes
}
</script>

<template>
  <div
    v-if="folderTree.length > 0"
    data-testid="sidebar-folders-actions"
    class="flex flex-col"
  >
    <template
      v-for="node in renderNodes(folderTree)"
      :key="node.path"
    >
      <SidebarFolderItem
        :folder-path="node.path"
        :folder-name="folderDisplayName(node.path)"
        :custom-icon="folderIcon(node.path)"
        :selected="isSelected(node.path)"
        :accent-color="accentColor"
        :has-children="node.children.length > 0"
        :expanded="isFolderExpanded(node.path)"
        :depth="0"
        @click="selectFolder(node.path)"
        @edit="handleEdit(node.path)"
        @toggle-expand="toggleFolderExpanded(node.path)"
        @create-subfolder="handleCreateSubfolder(node.path)"
      />
      <template v-if="isFolderExpanded(node.path)">
        <SidebarFolderSubtree
          :nodes="node.children"
          :depth="1"
          :folder-icon="folderIcon"
          :accent-color="accentColor"
          :selected-view="selectedView"
          :is-folder-expanded="isFolderExpanded"
          @select="selectFolder($event)"
          @edit="handleEdit($event)"
          @toggle-expand="toggleFolderExpanded($event)"
          @create-subfolder="handleCreateSubfolder($event)"
        />
      </template>
    </template>
    <div
      aria-hidden="true"
      class="h-[30px] shrink-0"
    />
  </div>
</template>
