<script setup lang="ts">
import { folderDisplayName } from '~/notes/folderTree'
import type { FolderTreeNode } from '~/notes/folderTree'
import type { SidebarWorkspaceView } from '~/notes/sidebarViewTypes'

const props = defineProps<{
  nodes: FolderTreeNode[]
  depth: number
  folderIcon: (path: string) => string | undefined
  accentColor: string
  selectedView: SidebarWorkspaceView
  isFolderExpanded: (path: string) => boolean
}>()

const emit = defineEmits<{
  select: [folderPath: string]
  edit: [folderPath: string]
  'toggle-expand': [folderPath: string]
  'create-subfolder': [parentPath: string]
}>()

function isSelected(folderPath: string): boolean {
  return (
    props.selectedView.kind === 'folder' &&
    props.selectedView.folderPath === folderPath
  )
}
</script>

<template>
  <template
    v-for="node in nodes"
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
      :depth="depth"
      @click="emit('select', node.path)"
      @edit="emit('edit', node.path)"
      @toggle-expand="emit('toggle-expand', node.path)"
      @create-subfolder="emit('create-subfolder', node.path)"
    />
    <template v-if="isFolderExpanded(node.path)">
      <SidebarFolderSubtree
        :nodes="node.children"
        :depth="depth + 1"
        :folder-icon="folderIcon"
        :accent-color="accentColor"
        :selected-view="selectedView"
        :is-folder-expanded="isFolderExpanded"
        @select="emit('select', $event)"
        @edit="emit('edit', $event)"
        @toggle-expand="emit('toggle-expand', $event)"
        @create-subfolder="emit('create-subfolder', $event)"
      />
    </template>
  </template>
</template>
