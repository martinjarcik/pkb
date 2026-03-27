<script setup lang="ts">
import { ref } from 'vue'
import { Inbox } from 'lucide-vue-next'

const { accentColor, selectedView, selectInbox } = useSidebarNavigation()
const { moveNote } = useNotes()
const dragDepth = ref(0)
const isInboxDropActive = ref(false)

function handleDragEnter(): void {
  dragDepth.value += 1
  isInboxDropActive.value = true
}

function handleDragLeave(): void {
  dragDepth.value = Math.max(0, dragDepth.value - 1)

  if (dragDepth.value === 0) {
    isInboxDropActive.value = false
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
  isInboxDropActive.value = false

  const noteId = event.dataTransfer?.getData('text/plain').trim()

  if (!noteId) {
    return
  }

  await moveNote(noteId, '')
}
</script>

<template>
  <nav
    data-testid="sidebar-navigation"
    class="sidebar-navigation-shell flex flex-col"
  >
    <SidebarNavigationItem
      navigation-id="inbox"
      :icon="Inbox"
      :label="$t('sidebarNavigation.inbox')"
      :selected="selectedView.kind === 'inbox'"
      :accent-color="accentColor"
      :drop-active="isInboxDropActive"
      @click="selectInbox"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
    />
  </nav>
</template>
