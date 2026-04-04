<script setup lang="ts">
import { onMounted } from 'vue'
import InspectorPanel from '~/components/InspectorPanel.vue'
import NotePanel from '~/components/NotePanel.vue'
import NotesListPanel from '~/components/NotesListPanel.vue'
import SidebarPanel from '~/components/SidebarPanel.vue'
import { useAppStartup } from '~/composables/useAppStartup'
import { useAppTheme } from '~/composables/useAppTheme'
import { useLayout } from '~/composables/useLayout'

const { startApp } = useAppStartup()
const { accentColor } = useAppTheme()
const { showInspectorPanel, showSidebarPanel, showNotesListPanel } = useLayout()

onMounted(() => {
  void startApp()
})
</script>

<template>
  <div
    class="h-screen min-h-0"
    :style="{ '--app-config-accent-color': accentColor }"
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

      <InspectorPanel
        v-show="showInspectorPanel"
        class="app-shell-inspector shrink-0"
      />
    </div>
  </div>
</template>
