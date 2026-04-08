<script setup lang="ts">
import { Calendar, Folder, Pin } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref } from 'vue'
import { useFolderMeta } from '~/composables/useFolderMeta'
import { useNotes } from '~/composables/useNotes'
import { useNotesListArrowNavigation } from '~/composables/useNotesListArrowNavigation'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'
import { useTranslations } from '~/composables/useTranslations'
import { useVirtualList } from '~/composables/useVirtualList'

type NotesListItem = {
  id: string
  title: string
  description: string
  meta: string
  metaKind: 'date' | 'folder'
  pinned: boolean
}

type NotesListRow = {
  id: string
  title: string
  description: string
  modifiedAt: string
  pinned?: boolean
}

type PointerDragState = {
  noteId: string
  startX: number
  startY: number
  active: boolean
  grabOffsetX: number
  grabOffsetY: number
}

const DRAG_THRESHOLD_PX = 6
const DROP_TARGET_ACTIVE_CLASS = 'app-note-drop-target-active'

const { t } = useTranslations()
const { folderIcon } = useFolderMeta()

function noteFolderPath(noteId: string): string {
  const slash = noteId.lastIndexOf('/')

  return slash === -1 ? '' : noteId.slice(0, slash)
}

function toListItem(row: NotesListRow, showFolderPath: boolean): NotesListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    meta: showFolderPath ? noteFolderPath(row.id) : row.modifiedAt.slice(0, 10),
    metaKind: showFolderPath ? 'folder' : 'date',
    pinned: row.pinned === true,
  }
}

const { isLoading, loadError, selectedNoteId, selectNoteById, moveNote } =
  useNotes()
const { selectedView, visibleCatalogRows } = useSidebarNavigation()

const pointerDrag = ref<PointerDragState | null>(null)
const suppressNextClickNoteId = ref<string | null>(null)

let draggingSourceEl: HTMLElement | null = null
let dragGhostEl: HTMLElement | null = null

const DRAG_GHOST_SCALE = 0.5

function removeDragGhost(): void {
  dragGhostEl?.remove()
  dragGhostEl = null
}

function positionDragGhost(clientX: number, clientY: number): void {
  if (!dragGhostEl || !pointerDrag.value) {
    return
  }

  const { grabOffsetX, grabOffsetY } = pointerDrag.value
  const tx = clientX - DRAG_GHOST_SCALE * grabOffsetX
  const ty = clientY - DRAG_GHOST_SCALE * grabOffsetY

  dragGhostEl.style.transform = `translate(${tx}px, ${ty}px) scale(${DRAG_GHOST_SCALE})`
}

function createDragGhost(clientX: number, clientY: number): void {
  if (!draggingSourceEl) {
    return
  }

  removeDragGhost()

  const rect = draggingSourceEl.getBoundingClientRect()
  const ghost = draggingSourceEl.cloneNode(true) as HTMLElement

  ghost.classList.add('notes-list-drag-ghost')
  ghost.removeAttribute('data-testid')
  ghost.style.position = 'fixed'
  ghost.style.left = '0'
  ghost.style.top = '0'
  ghost.style.right = 'auto'
  ghost.style.bottom = 'auto'
  ghost.style.width = `${rect.width}px`
  ghost.style.boxSizing = 'border-box'
  ghost.style.margin = '0'
  ghost.style.zIndex = '10000'
  ghost.style.pointerEvents = 'none'
  ghost.style.transformOrigin = 'top left'
  ghost.setAttribute('aria-hidden', 'true')
  ghost.setAttribute('tabindex', '-1')
  document.body.appendChild(ghost)
  dragGhostEl = ghost
  positionDragGhost(clientX, clientY)
}

function clearDropTargetHighlight(): void {
  for (const el of document.querySelectorAll(`.${DROP_TARGET_ACTIVE_CLASS}`)) {
    el.classList.remove(DROP_TARGET_ACTIVE_CLASS)
  }
}

function updateDropTargetHighlight(clientX: number, clientY: number): void {
  clearDropTargetHighlight()
  const hit = document.elementFromPoint(clientX, clientY)
  const folderRow = hit?.closest('[data-folder-path]')

  if (
    folderRow instanceof HTMLElement &&
    folderRow.dataset.folderPath != null
  ) {
    folderRow.classList.add(DROP_TARGET_ACTIVE_CLASS)

    return
  }

  const inbox = hit?.closest('[data-sidebar-drop-inbox]')

  if (inbox instanceof HTMLElement) {
    inbox.classList.add(DROP_TARGET_ACTIVE_CLASS)
  }
}

function activatePointerDragVisuals(): void {
  document.documentElement.classList.add('app-note-pointer-dragging')
  document.body.style.userSelect = 'none'
  draggingSourceEl?.classList.add('notes-list-item-pointer-dragging')
}

function clearPointerDragUi(): void {
  clearDropTargetHighlight()
  removeDragGhost()
  draggingSourceEl?.classList.remove('notes-list-item-pointer-dragging')
  draggingSourceEl = null
  document.documentElement.classList.remove('app-note-pointer-dragging')
  document.body.style.userSelect = ''
}

const listItems = computed(() => {
  const showFolderPath =
    selectedView.value.kind === 'search' || selectedView.value.kind === 'tags'

  return visibleCatalogRows.value.map((row) => toListItem(row, showFolderPath))
})
const {
  listViewport,
  totalHeight,
  visibleRows,
  handleScroll,
  registerRowElement,
  scrollItemIdIntoView,
} = useVirtualList({
  items: listItems,
})

const orderedListIds = computed(() => listItems.value.map((item) => item.id))

const { onNotesListKeydown } = useNotesListArrowNavigation({
  orderedIds: orderedListIds,
  selectedNoteId,
  selectNote: handleSelectNote,
  scrollItemIdIntoView,
})

function bindDocumentPointerDrag(): void {
  document.addEventListener('pointermove', onDocumentPointerMove, true)
  document.addEventListener('pointerup', onDocumentPointerUp, true)
  document.addEventListener('pointercancel', onDocumentPointerCancel, true)
}

function unbindDocumentPointerDrag(): void {
  document.removeEventListener('pointermove', onDocumentPointerMove, true)
  document.removeEventListener('pointerup', onDocumentPointerUp, true)
  document.removeEventListener('pointercancel', onDocumentPointerCancel, true)
}

function onDocumentPointerMove(event: PointerEvent): void {
  const s = pointerDrag.value

  if (!s) {
    return
  }

  const dx = event.clientX - s.startX
  const dy = event.clientY - s.startY

  if (!s.active) {
    if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD_PX) {
      return
    }

    pointerDrag.value = { ...s, active: true }
    activatePointerDragVisuals()
    createDragGhost(event.clientX, event.clientY)
    updateDropTargetHighlight(event.clientX, event.clientY)

    return
  }

  positionDragGhost(event.clientX, event.clientY)
  updateDropTargetHighlight(event.clientX, event.clientY)
}

function onDocumentPointerUp(event: PointerEvent): void {
  const s = pointerDrag.value

  unbindDocumentPointerDrag()
  pointerDrag.value = null

  if (!s?.active) {
    draggingSourceEl = null

    return
  }

  const el = document.elementFromPoint(event.clientX, event.clientY)

  clearPointerDragUi()

  const folderRow = el?.closest('[data-folder-path]')

  if (
    folderRow instanceof HTMLElement &&
    folderRow.dataset.folderPath != null
  ) {
    suppressNextClickNoteId.value = s.noteId
    void moveNote(s.noteId, folderRow.dataset.folderPath)

    return
  }

  const inbox = el?.closest('[data-sidebar-drop-inbox]')

  if (inbox) {
    suppressNextClickNoteId.value = s.noteId
    void moveNote(s.noteId, '')
  }
}

function onDocumentPointerCancel(): void {
  const s = pointerDrag.value

  unbindDocumentPointerDrag()
  pointerDrag.value = null

  if (s?.active) {
    clearPointerDragUi()
  } else {
    draggingSourceEl = null
  }
}

function onNotePointerDown(event: PointerEvent, noteId: string): void {
  if (event.button !== 0) {
    return
  }

  const row =
    event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  const rect = row?.getBoundingClientRect() ?? { left: 0, top: 0 }

  draggingSourceEl = row
  pointerDrag.value = {
    noteId,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    grabOffsetX: event.clientX - rect.left,
    grabOffsetY: event.clientY - rect.top,
  }
  bindDocumentPointerDrag()
}

onBeforeUnmount(() => {
  unbindDocumentPointerDrag()
  pointerDrag.value = null
  clearPointerDragUi()
})

async function handleSelectNote(id: string): Promise<void> {
  if (suppressNextClickNoteId.value === id) {
    suppressNextClickNoteId.value = null

    return
  }

  await selectNoteById(id)
}

function getRowStyle(itemId: string): { [key: string]: string } | undefined {
  const isSelected = itemId === selectedNoteId.value
  const style: { [key: string]: string } = {}

  if (isSelected) {
    style['--notes-list-item-selected-border-color'] =
      'var(--app-config-accent-color)'
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
    tabindex="0"
    class="min-h-0 flex-1 overflow-y-auto outline-none"
    @scroll="handleScroll"
    @keydown="onNotesListKeydown"
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
        :class="{
          'notes-list-item-selected': row.item.id === selectedNoteId,
          'notes-list-item-pinned': row.item.pinned,
        }"
        :style="[getVirtualRowStyle(row.offset), getRowStyle(row.item.id)]"
        @click="handleSelectNote(row.item.id)"
        @pointerdown="onNotePointerDown($event, row.item.id)"
      >
        <Pin
          v-if="row.item.pinned"
          :size="15"
          class="notes-list-item-pin-icon"
        />
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
            <template
              v-if="row.item.metaKind === 'folder' && row.item.meta.length > 0"
            >
              <span
                v-if="typeof folderIcon(row.item.meta) === 'string'"
                class="notes-list-item-meta-icon notes-list-item-meta-icon-emoji"
                aria-hidden="true"
              >{{ folderIcon(row.item.meta) }}</span>
              <Folder
                v-else
                :size="10"
                class="notes-list-item-meta-icon"
                aria-hidden="true"
              />
              <span>{{ row.item.meta }}</span>
            </template>
            <template v-else-if="row.item.metaKind === 'date'">
              <Calendar
                :size="10"
                class="notes-list-item-meta-icon"
                aria-hidden="true"
              />
              <span>{{ row.item.meta }}</span>
            </template>
            <template v-else>
              {{ row.item.meta }}
            </template>
          </p>
        </div>
      </button>
    </div>
  </div>
</template>
