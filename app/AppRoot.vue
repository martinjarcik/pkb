<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from 'vue'
import NotePanel from '~/components/NotePanel.vue'
import NotesListPanel from '~/components/NotesListPanel.vue'
import SidebarPanel from '~/components/SidebarPanel.vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useFontLoader } from '~/composables/useFontLoader'
import { useAppStartup } from '~/composables/useAppStartup'
import { useAppTheme } from '~/composables/useAppTheme'
import { useLayout } from '~/composables/useLayout'
import { syncEditorColors } from '~/lib/editorColors'

type ResizeTarget = 'sidebar' | 'notesList'

const MIN_SIDEBAR_PANEL_WIDTH = 220
const MIN_NOTES_LIST_PANEL_WIDTH = 260
const MIN_EDITOR_PANEL_WIDTH = 360

const { data: appConfigDisk } = useAppConfigDisk()
const { startApp } = useAppStartup()
const {
  accentColor,
  sidebarBackgroundColor,
  sidebarTextColor,
  applicationTypeface,
  applicationFontSize,
  editorTypeface,
  editorFontSize,
} = useAppTheme()
const {
  notesListPanelWidth,
  persistNotesListPanelWidth,
  persistSidebarPanelWidth,
  setNotesListPanelWidth,
  setSidebarPanelWidth,
  showSidebarPanel,
  showNotesListPanel,
  sidebarPanelWidth,
} = useLayout()
const { ensureFontLoaded, ensureSidebarBadgeFontLoaded } = useFontLoader()

const workspaceShellRef = ref<HTMLElement | null>(null)
const activeResizeTarget = ref<ResizeTarget | null>(null)
const resizeStartPointerX = ref(0)
const resizeStartWidth = ref(0)

const sidebarPanelStyle = computed(() => ({
  width: `${sidebarPanelWidth.value}px`,
}))

const notesListPanelStyle = computed(() => ({
  width: `${notesListPanelWidth.value}px`,
}))

watchEffect(() => {
  syncEditorColors(appConfigDisk.value)
})

watchEffect(() => {
  document.documentElement.style.fontFamily = applicationTypeface.value
  document.documentElement.style.fontSize = applicationFontSize.value
})

watch(
  [applicationTypeface, editorTypeface],
  ([nextApplicationTypeface, nextEditorTypeface]) => {
    void ensureFontLoaded(nextApplicationTypeface)

    if (nextEditorTypeface === nextApplicationTypeface) {
      return
    }

    void ensureFontLoaded(nextEditorTypeface)
  },
  {
    immediate: true,
  },
)

function clampWidth(value: number, minWidth: number, maxWidth: number): number {
  const upperBound = Math.max(minWidth, maxWidth)
  return Math.min(Math.max(value, minWidth), upperBound)
}

function getWorkspaceShellRect(): DOMRect | null {
  return workspaceShellRef.value?.getBoundingClientRect() ?? null
}

function getVisibleSidebarPanelWidth(): number {
  return showSidebarPanel.value ? sidebarPanelWidth.value : 0
}

function getVisibleNotesListPanelWidth(): number {
  return showNotesListPanel.value ? notesListPanelWidth.value : 0
}

function updateSidebarWidth(pointerX: number): void {
  const rect = getWorkspaceShellRect()

  if (rect === null) {
    return
  }

  const deltaX = pointerX - resizeStartPointerX.value
  const nextWidth = resizeStartWidth.value + deltaX
  const maxWidth =
    rect.width - getVisibleNotesListPanelWidth() - MIN_EDITOR_PANEL_WIDTH

  setSidebarPanelWidth(clampWidth(nextWidth, MIN_SIDEBAR_PANEL_WIDTH, maxWidth))
}

function updateNotesListWidth(pointerX: number): void {
  const rect = getWorkspaceShellRect()

  if (rect === null) {
    return
  }

  const deltaX = pointerX - resizeStartPointerX.value
  const nextWidth = resizeStartWidth.value + deltaX
  const maxWidth =
    rect.width - getVisibleSidebarPanelWidth() - MIN_EDITOR_PANEL_WIDTH

  setNotesListPanelWidth(
    clampWidth(nextWidth, MIN_NOTES_LIST_PANEL_WIDTH, maxWidth),
  )
}

function handleResizePointerMove(event: PointerEvent): void {
  if (activeResizeTarget.value === 'sidebar') {
    updateSidebarWidth(event.clientX)
    return
  }

  if (activeResizeTarget.value === 'notesList') {
    updateNotesListWidth(event.clientX)
  }
}

function stopResize(): void {
  const target = activeResizeTarget.value

  if (target === null) {
    return
  }

  activeResizeTarget.value = null
  document.documentElement.classList.remove('app-shell-resizing')
  window.removeEventListener('pointermove', handleResizePointerMove)
  window.removeEventListener('pointerup', stopResize)
  window.removeEventListener('pointercancel', stopResize)

  if (target === 'sidebar') {
    persistSidebarPanelWidth(Math.round(sidebarPanelWidth.value))
    return
  }

  persistNotesListPanelWidth(Math.round(notesListPanelWidth.value))
}

function startResize(target: ResizeTarget, event: PointerEvent): void {
  if (event.button !== 0 || !event.isPrimary) {
    return
  }

  if (workspaceShellRef.value === null) {
    return
  }

  if (target === 'sidebar' && !showSidebarPanel.value) {
    return
  }

  if (target === 'notesList' && !showNotesListPanel.value) {
    return
  }

  stopResize()
  activeResizeTarget.value = target
  resizeStartPointerX.value = event.clientX
  resizeStartWidth.value =
    target === 'sidebar' ? sidebarPanelWidth.value : notesListPanelWidth.value
  document.documentElement.classList.add('app-shell-resizing')
  window.addEventListener('pointermove', handleResizePointerMove)
  window.addEventListener('pointerup', stopResize)
  window.addEventListener('pointercancel', stopResize)
  event.preventDefault()
}

onMounted(() => {
  void ensureSidebarBadgeFontLoaded()
  void startApp()
})

onBeforeUnmount(() => {
  stopResize()
  document.documentElement.style.removeProperty('font-family')
  document.documentElement.style.removeProperty('font-size')
})
</script>

<template>
  <div
    class="h-screen min-h-0"
    :style="{
      '--app-config-accent-color': accentColor,
      '--app-config-sidebar-background-color': sidebarBackgroundColor,
      '--app-config-sidebar-text-color': sidebarTextColor,
      '--app-config-editor-font-family': editorTypeface,
      '--app-config-editor-font-size': editorFontSize,
    }"
  >
    <div
      ref="workspaceShellRef"
      class="flex h-screen overflow-hidden text-foreground"
    >
      <SidebarPanel
        v-show="showSidebarPanel"
        class="app-shell-sidebar shrink-0"
        :style="sidebarPanelStyle"
      />
      <button
        v-if="showSidebarPanel"
        :aria-label="
          showNotesListPanel
            ? 'Resize sidebar and notes list'
            : 'Resize sidebar and editor'
        "
        :class="[
          'app-shell-resize-handle app-shell-resize-handle-sidebar shrink-0',
          {
            'app-shell-resize-handle-active': activeResizeTarget === 'sidebar',
          },
        ]"
        type="button"
        @pointerdown="startResize('sidebar', $event)"
      />
      <NotesListPanel
        v-show="showNotesListPanel"
        class="app-shell-notes-list shrink-0"
        :style="notesListPanelStyle"
      />
      <button
        v-if="showNotesListPanel"
        aria-label="Resize notes list and editor"
        :class="[
          'app-shell-resize-handle app-shell-resize-handle-notes-list shrink-0',
          {
            'app-shell-resize-handle-active':
              activeResizeTarget === 'notesList',
          },
        ]"
        type="button"
        @pointerdown="startResize('notesList', $event)"
      />

      <div class="min-w-0 flex-1">
        <NotePanel />
      </div>
    </div>
  </div>
</template>
