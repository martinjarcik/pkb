<script setup lang="ts">
import { Inbox, ListTodo, Star, Trash2 } from 'lucide-vue-next'
import { useAppFeatures } from '~/composables/useAppFeatures'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'
import { useTranslations } from '~/composables/useTranslations'

const { t } = useTranslations()
const {
  selectedView,
  selectInbox,
  selectTasks,
  selectFavorites,
  selectTrashed,
} = useSidebarNavigation()

const { favorites: favoritesEnabled, tasks: tasksEnabled } = useAppFeatures()
</script>

<template>
  <nav
    data-testid="sidebar-navigation"
    class="sidebar-navigation-shell flex flex-col"
  >
    <div data-sidebar-drop-inbox>
      <SidebarNavigationItem
        navigation-id="inbox"
        :icon="Inbox"
        :label="t('sidebarNavigation.inbox')"
        :selected="selectedView.kind === 'inbox'"
        @activate="selectInbox"
      />
    </div>
    <SidebarNavigationItem
      v-if="tasksEnabled"
      navigation-id="tasks"
      :icon="ListTodo"
      :label="t('sidebarNavigation.tasks')"
      :selected="selectedView.kind === 'tasks'"
      @activate="selectTasks"
    />
    <SidebarNavigationItem
      v-if="favoritesEnabled"
      navigation-id="favorites"
      :icon="Star"
      :label="t('sidebarNavigation.favorites')"
      :selected="selectedView.kind === 'favorites'"
      @activate="selectFavorites"
    />
    <SidebarNavigationItem
      navigation-id="trashed"
      :icon="Trash2"
      :label="t('sidebarNavigation.trashed')"
      :selected="selectedView.kind === 'trashed'"
      @activate="selectTrashed"
    />
  </nav>
</template>
