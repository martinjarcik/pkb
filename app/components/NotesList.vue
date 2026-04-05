<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNotes } from '~/composables/useNotes'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'
import { useTranslations } from '~/composables/useTranslations'
import { useVirtualList } from '~/composables/useVirtualList'

type NotesListItem = {
  id: string
  title: string
  description: string
  meta: string
  pinned: boolean
}

type NotesListRow = {
  id: string
  title: string
  description: string
  modifiedAt: string
  pinned?: boolean
}

const DRAG_PREVIEW_SCALE = 0.5

const { t } = useTranslations()

function toListItem(row: NotesListRow): NotesListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    meta: row.modifiedAt.slice(0, 10),
    pinned: row.pinned === true,
  }
}

const { isLoading, loadError, selectedNoteId, selectNoteById } = useNotes()
const { accentColor, visibleCatalogRows } = useSidebarNavigation()

const dragPreview = ref<HTMLElement | null>(null)
const listItems = computed(() => visibleCatalogRows.value.map(toListItem))
const {
  listViewport,
  totalHeight,
  visibleRows,
  handleScroll,
  registerRowElement,
} = useVirtualList({
  items: listItems,
})

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

  dragPreview.value?.remove()

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
  nextPreview.style.backgroundColor = 'hsl(var(--background))'
  nextPreview.style.border = `1px solid ${accentColor.value}`
  nextPreview.style.borderRight = '0'
  nextPreview.style.pointerEvents = 'none'

  document.body.append(nextPreview)
  event.dataTransfer.setDragImage(
    nextPreview,
    12 * DRAG_PREVIEW_SCALE,
    12 * DRAG_PREVIEW_SCALE,
  )
  dragPreview.value = nextPreview
}

function handleDragEnd(event: DragEvent): void {
  event.dataTransfer?.clearData()
  dragPreview.value?.remove()
  dragPreview.value = null
}

function getRowStyle(
  itemId: string,
  pinned: boolean,
): { [key: string]: string } | undefined {
  const isSelected = itemId === selectedNoteId.value
  const style: { [key: string]: string } = {}

  if (isSelected) {
    style['--notes-list-item-selected-border-color'] = accentColor.value
  }

  if (pinned && !isSelected) {
    style.backgroundColor = `color-mix(in srgb, ${accentColor.value} 5%, transparent)`
  }

  return Object.keys(style).length > 0 ? style : undefined
}

function getVirtualRowStyle(offset: number): Record<string, string> {
  return {
    left: '0',
    position: 'absolute',
    right: '0',
    top: '0',
    transform: `translateY(${offset}px)`,
  }
}
</script>

<template>
  <div
    ref="listViewport"
    data-testid="notes-list"
    class="min-h-0 flex-1 overflow-y-auto"
    @scroll="handleScroll"
  >
    <div
      v-if="isLoading"
      class="notes-list-state notes-list-state-muted"
    >
      {{ t('notesList.loading') }}
    </div>

    <div
      v-else-if="loadError"
      class="notes-list-state notes-list-state-error"
    >
      {{ loadError }}
    </div>

    <div
      v-else-if="listItems.length === 0"
      data-testid="notes-list-empty"
      class="notes-list-state notes-list-state-muted"
    >
      {{ t('notesList.empty') }}
    </div>

    <div
      v-else
      class="relative"
      :style="{ height: `${totalHeight}px` }"
    >
      <button
        v-for="row in visibleRows"
        :key="row.item.id"
        :ref="(element) => registerRowElement(row.item.id, element)"
        type="button"
        :data-note-id="row.item.id"
        :data-selected="row.item.id === selectedNoteId ? 'true' : 'false'"
        :data-pinned="row.item.pinned ? 'true' : 'false'"
        data-testid="notes-list-item"
        class="notes-list-item"
        draggable="true"
        :class="{
          'notes-list-item-selected': row.item.id === selectedNoteId,
          'notes-list-item-pinned': row.item.pinned,
        }"
        :style="[
          getVirtualRowStyle(row.offset),
          getRowStyle(row.item.id, row.item.pinned),
        ]"
        @click="handleSelectNote(row.item.id)"
        @dragstart="handleDragStart($event, row.item.id)"
        @dragend="handleDragEnd"
      >
        <div class="notes-list-item-content">
          <p
            data-testid="notes-list-item-title"
            class="notes-list-item-title truncate"
          >
            {{ row.item.title }}
          </p>
          <p
            v-if="row.item.description"
            class="notes-list-item-description"
          >
            {{ row.item.description }}
          </p>
          <p class="notes-list-item-meta">
            {{ row.item.meta }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>
