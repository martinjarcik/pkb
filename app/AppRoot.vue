<script setup lang="ts">
import { onMounted, watchEffect } from 'vue'
import NotePanel from '~/components/NotePanel.vue'
import NotesListPanel from '~/components/NotesListPanel.vue'
import SidebarPanel from '~/components/SidebarPanel.vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useAppStartup } from '~/composables/useAppStartup'
import { useAppTheme } from '~/composables/useAppTheme'
import { useLayout } from '~/composables/useLayout'
import { syncEditorColors } from '~/lib/editorColors'

const { data: appConfigDisk } = useAppConfigDisk()
const { startApp } = useAppStartup()
const { accentColor, sidebarBackgroundColor, sidebarTextColor } = useAppTheme()
const { showSidebarPanel, showNotesListPanel } = useLayout()

watchEffect(() => {
  syncEditorColors(appConfigDisk.value)
})

onMounted(() => {
  void startApp()
})
</script>

<template>
  <div
    class="h-screen min-h-0"
    :style="{
      '--app-config-accent-color': accentColor,
      '--app-config-sidebar-background-color': sidebarBackgroundColor,
      '--app-config-sidebar-text-color': sidebarTextColor,
    }"
  >
    <div class="flex h-screen overflow-hidden text-foreground">
      <SidebarPanel
        v-show="showSidebarPanel"
        class="app-shell-sidebar shrink-0"
      />
      <NotesListPanel
        v-show="showNotesListPanel"
        class="app-shell-notes-list shrink-0"
      />

      <div class="min-w-0 flex-1">
        <NotePanel />
      </div>
    </div>
  </div>
</template>
