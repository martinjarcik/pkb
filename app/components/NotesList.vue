<script setup lang="ts">
import { computed } from 'vue'
import type { NoteCatalogRow } from '~/notes/types'

type NotesListItem = {
  id: string
  title: string
  description: string
  meta: string
}

let dragPreview: HTMLElement | null = null
const DRAG_PREVIEW_SCALE = 0.5

function toListItem(row: NoteCatalogRow): NotesListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    meta: row.modifiedAt.slice(0, 10),
  }
}

const { isLoading, loadError, selectedNoteId, selectNoteById } = useNotes()
const { accentColor, visibleCatalogRows } = useSidebarNavigation()

const listItems = computed(() => visibleCatalogRows.value.map(toListItem))

async function handleSelectNote(id: string): Promise<void> {
  await selectNoteById(id)
}

function handleDragStart(event: DragEvent, id: string): void {
  const source = event.currentTarget

  if (!(source instanceof HTMLElement) || !event.dataTransfer) {
    return
  }

  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', id)

  dragPreview?.remove()

  const nextPreview = source.cloneNode(true)

  if (!(nextPreview instanceof HTMLElement)) {
    return
  }

  const { width } = source.getBoundingClientRect()

  nextPreview.style.position = 'fixed'
  nextPreview.style.top = '-10000px'
  nextPreview.style.left = '-10000px'
  nextPreview.style.width = `${width * DRAG_PREVIEW_SCALE}px`
  nextPreview.style.minWidth = `${width * DRAG_PREVIEW_SCALE}px`
  nextPreview.style.maxWidth = `${width * DRAG_PREVIEW_SCALE}px`
  nextPreview.style.margin = '0'
  nextPreview.style.zoom = String(DRAG_PREVIEW_SCALE)
  nextPreview.style.backgroundColor = '#ffffff'
  nextPreview.style.border = `1px solid ${accentColor.value}`
  nextPreview.style.borderRight = '0'
  nextPreview.style.pointerEvents = 'none'

  document.body.append(nextPreview)
  event.dataTransfer.setDragImage(
    nextPreview,
    12 * DRAG_PREVIEW_SCALE,
    12 * DRAG_PREVIEW_SCALE,
  )
  dragPreview = nextPreview
}

function handleDragEnd(event: DragEvent): void {
  event.dataTransfer?.clearData()
  dragPreview?.remove()
  dragPreview = null
}

function getItemStyle(
  isSelected: boolean,
): { [key: string]: string } | undefined {
  if (!isSelected) {
    return undefined
  }

  return {
    '--notes-list-item-selected-border-color': accentColor.value,
  }
}
</script>

<template>
  <div data-testid="notes-list" class="min-h-0 flex-1 overflow-y-auto">
    <div v-if="isLoading" class="notes-list-state notes-list-state-muted">
      {{ $t('notesList.loading') }}
    </div>

    <div v-else-if="loadError" class="notes-list-state notes-list-state-error">
      {{ loadError }}
    </div>

    <div
      v-else-if="listItems.length === 0"
      data-testid="notes-list-empty"
      class="notes-list-state notes-list-state-muted"
    >
      {{ $t('notesList.empty') }}
    </div>

    <div v-else class="flex flex-col">
      <button
        v-for="item in listItems"
        :key="item.id"
        type="button"
        :data-note-id="item.id"
        :data-selected="item.id === selectedNoteId ? 'true' : 'false'"
        data-testid="notes-list-item"
        class="notes-list-item"
        draggable="true"
        :class="{
          'notes-list-item-selected': item.id === selectedNoteId,
        }"
        :style="getItemStyle(item.id === selectedNoteId)"
        @click="handleSelectNote(item.id)"
        @dragstart="handleDragStart($event, item.id)"
        @dragend="handleDragEnd"
      >
        <div class="notes-list-item-content">
          <p
            data-testid="notes-list-item-title"
            class="notes-list-item-title truncate"
          >
            {{ item.title }}
          </p>
          <p v-if="item.description" class="notes-list-item-description">
            {{ item.description }}
          </p>
          <p class="notes-list-item-meta">
            {{ item.meta }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>
