<script setup lang="ts">
import { computed, ref } from 'vue'
import { Folder } from 'lucide-vue-next'

const props = defineProps<{
  folderName: string
  selected: boolean
  accentColor: string
}>()

const { moveNote } = useNotes()
const emit = defineEmits<{
  click: []
}>()

const navigationId = computed(() => `folder:${props.folderName}`)
const dragDepth = ref(0)
const isDropActive = ref(false)

function handleClick(): void {
  emit('click')
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
  <SidebarNavigationItem
    :navigation-id="navigationId"
    :icon="Folder"
    :label="folderName"
    :selected="selected"
    :accent-color="accentColor"
    :drop-active="isDropActive"
    @activate="handleClick"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  />
</template>
