<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

const { accentColor, selectedView, selectInbox } = useSidebarNavigation()
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
      @click="selectInbox"
    />
  </nav>
</template>
