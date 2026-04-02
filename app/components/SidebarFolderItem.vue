<script setup lang="ts">
import { computed } from 'vue'
import { Folder, Pencil } from 'lucide-vue-next'

const props = defineProps<{
  folderName: string
  selected: boolean
  accentColor: string
  customIcon?: string
}>()

const { moveNote } = useNotes()
const emit = defineEmits<{
  click: []
  edit: []
}>()

const navigationId = computed(() => `folder:${props.folderName}`)
const displayIcon = computed(() =>
  props.customIcon && props.customIcon.length > 0 ? props.customIcon : Folder,
)
const {
  isDropActive,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
} = useNoteDropTarget(async (noteId) => {
  await moveNote(noteId, props.folderName)
})

function handleClick(): void {
  emit('click')
}

function handleEditClick(event: MouseEvent): void {
  event.stopPropagation()
  emit('edit')
}
</script>

<template>
  <div
    class="group relative w-[180px]"
    data-testid="sidebar-folder-row"
    :data-folder-name="folderName"
  >
    <SidebarNavigationItem
      :navigation-id="navigationId"
      :icon="displayIcon"
      :label="folderName"
      :selected="selected"
      :accent-color="accentColor"
      :drop-active="isDropActive"
      class="!w-full !pr-7"
      @activate="handleClick"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
    />
    <button
      type="button"
      class="absolute right-1 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      :class="{
        'text-white': selected,
        'text-foreground/80': !selected,
      }"
      :aria-label="$t('sidebarFolders.editFolder')"
      data-testid="sidebar-folder-edit"
      @click="handleEditClick"
    >
      <Pencil :size="12" aria-hidden="true" />
    </button>
  </div>
</template>
