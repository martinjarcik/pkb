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
import OnboardingGuide from '~/components/OnboardingGuide.vue'
import SidebarPanel from '~/components/SidebarPanel.vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useFontLoader } from '~/composables/useFontLoader'
import { useOnboarding } from '~/composables/useOnboarding'
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
const { loadOnboarding, onboardingOpen } = useOnboarding()
const {
  accentColor,
  sidebarBackgroundColor,
  sidebarSelectedTextContrastClass,
  sidebarTextContrastClass,
  sidebarBadge,
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
const {
  ensureApplicationFontLoaded,
  ensureEditorFontLoaded,
  ensureSidebarBadgeFontLoaded,
} = useFontLoader()

const workspaceShellRef = ref<HTMLElement | null>(null)
const activeResizeTarget = ref<ResizeTarget | null>(null)
const appliedApplicationTypeface = ref(applicationTypeface.value)
const applicationTypefaceLoadId = ref(0)
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
  document.documentElement.style.fontFamily = appliedApplicationTypeface.value
  document.documentElement.style.fontSize = applicationFontSize.value
})

watch(
  applicationTypeface,
  async (nextApplicationTypeface) => {
    const loadId = applicationTypefaceLoadId.value + 1
    applicationTypefaceLoadId.value = loadId
    await ensureApplicationFontLoaded(nextApplicationTypeface)

    if (loadId !== applicationTypefaceLoadId.value) {
      return
    }

    appliedApplicationTypeface.value = nextApplicationTypeface
  },
  {
    immediate: true,
  },
)

watch(
  editorTypeface,
  (nextEditorTypeface) => {
    if (nextEditorTypeface === applicationTypeface.value) {
      return
    }

    void ensureEditorFontLoaded(nextEditorTypeface)
  },
  {
    immediate: true,
  },
)

watch(
  sidebarBadge,
  (nextSidebarBadge) => {
    void ensureSidebarBadgeFontLoaded(nextSidebarBadge)
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
  void (async () => {
    await startApp()
    await loadOnboarding()
  })()
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
      '--app-config-editor-font-family': editorTypeface,
      '--app-config-editor-font-size': editorFontSize,
    }"
  >
    <div
      ref="workspaceShellRef"
      :class="[
        'flex h-screen overflow-hidden text-foreground',
        sidebarTextContrastClass,
        sidebarSelectedTextContrastClass,
        { 'pointer-events-none select-none': onboardingOpen },
      ]"
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

    <OnboardingGuide v-if="onboardingOpen" />
  </div>
</template>
