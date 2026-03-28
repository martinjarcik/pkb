<script setup lang="ts">
import { computed, ref } from 'vue'
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
const dragDepth = ref(0)
const isDropActive = ref(false)

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

function handleDragEnter(): void {
  dragDepth.value += 1
  isDropActive.value = true
}

function handleDragLeave(): void {
  dragDepth.value = Math.max(0, dragDepth.value - 1)

  if (dragDepth.value === 0) {
    isDropActive.value = false
  }
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault()

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

async function handleDrop(event: DragEvent): Promise<void> {
  event.preventDefault()
  dragDepth.value = 0
  isDropActive.value = false

  const noteId = event.dataTransfer?.getData('text/plain').trim()

  if (!noteId) {
    return
  }

  await moveNote(noteId, props.folderName)
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
