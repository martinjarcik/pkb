<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, Folder, FolderPlus, Pencil } from 'lucide-vue-next'
import { useTranslations } from '~/composables/useTranslations'

const { t } = useTranslations()

const props = defineProps<{
  folderPath: string
  folderName: string
  selected: boolean
  customIcon?: string
  hasChildren?: boolean
  expanded?: boolean
  depth?: number
}>()

const emit = defineEmits<{
  click: []
  edit: []
  'toggle-expand': []
  'create-subfolder': []
}>()

const indentPx = computed(() => (props.depth ?? 0) * 16)
const navigationId = computed(() => `folder:${props.folderPath}`)
const displayIcon = computed(() =>
  props.customIcon && props.customIcon.length > 0 ? props.customIcon : Folder,
)

function handleClick(): void {
  emit('click')
}

function handleEditClick(event: MouseEvent): void {
  event.stopPropagation()
  emit('edit')
}

function handleExpandClick(event: MouseEvent): void {
  event.stopPropagation()
  emit('toggle-expand')
}

function handleCreateSubfolderClick(event: MouseEvent): void {
  event.stopPropagation()
  emit('create-subfolder')
}
</script>

<template>
  <div
    class="group relative flex items-center"
    data-testid="sidebar-folder-row"
    :data-folder-path="folderPath"
    :style="{ paddingLeft: `${indentPx}px` }"
  >
    <button
      v-if="hasChildren"
      type="button"
      class="sidebar-folder-expand-button flex h-6 w-4 shrink-0 items-center justify-center rounded transition-colors"
      :aria-label="
        expanded
          ? t('sidebarFolders.collapseFolder')
          : t('sidebarFolders.expandFolder')
      "
      data-testid="sidebar-folder-expand"
      @click="handleExpandClick"
    >
      <ChevronRight
        :size="12"
        aria-hidden="true"
        class="transition-transform"
        :class="{ 'rotate-90': expanded }"
      />
    </button>
    <div
      v-else
      class="w-4 shrink-0"
      aria-hidden="true"
    />

    <SidebarNavigationItem
      :navigation-id="navigationId"
      :icon="displayIcon"
      :label="folderName"
      :selected="selected"
      class="!w-full !pr-14"
      @activate="handleClick"
    />
    <div
      class="pointer-events-none absolute right-1 top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
    >
      <button
        type="button"
        class="sidebar-folder-row-action pointer-events-auto flex h-6 w-6 items-center justify-center rounded"
        :class="{
          'sidebar-folder-row-action-selected': selected,
        }"
        :aria-label="t('sidebarFolders.createSubfolder')"
        data-testid="sidebar-folder-create-subfolder"
        @click="handleCreateSubfolderClick"
      >
        <FolderPlus
          :size="12"
          aria-hidden="true"
        />
      </button>
      <button
        type="button"
        class="sidebar-folder-row-action pointer-events-auto flex h-6 w-6 items-center justify-center rounded"
        :class="{
          'sidebar-folder-row-action-selected': selected,
        }"
        :aria-label="t('sidebarFolders.editFolder')"
        data-testid="sidebar-folder-edit"
        @click="handleEditClick"
      >
        <Pencil
          :size="12"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
