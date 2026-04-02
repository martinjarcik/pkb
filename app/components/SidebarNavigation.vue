<script setup lang="ts">
import { Inbox, ListTodo, Star, Trash2 } from 'lucide-vue-next'

const {
  accentColor,
  selectedView,
  selectInbox,
  selectTasks,
  selectFavorites,
  selectTrashed,
} = useSidebarNavigation()

const { favorites: favoritesEnabled, tasks: tasksEnabled } = useAppFeatures()
const { moveNote } = useNotes()
const {
  isDropActive: isInboxDropActive,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
} = useNoteDropTarget(async (noteId) => {
  await moveNote(noteId, '')
})
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
      @activate="selectInbox"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
    />
    <SidebarNavigationItem
      v-if="tasksEnabled"
      navigation-id="tasks"
      :icon="ListTodo"
      :label="$t('sidebarNavigation.tasks')"
      :selected="selectedView.kind === 'tasks'"
      :accent-color="accentColor"
      @activate="selectTasks"
    />
    <SidebarNavigationItem
      v-if="favoritesEnabled"
      navigation-id="favorites"
      :icon="Star"
      :label="$t('sidebarNavigation.favorites')"
      :selected="selectedView.kind === 'favorites'"
      :accent-color="accentColor"
      @activate="selectFavorites"
    />
    <SidebarNavigationItem
      navigation-id="trashed"
      :icon="Trash2"
      :label="$t('sidebarNavigation.trashed')"
      :selected="selectedView.kind === 'trashed'"
      :accent-color="accentColor"
      @activate="selectTrashed"
    />
  </nav>
</template>
