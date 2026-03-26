<script setup lang="ts">
const { accentColor, selectedView, selectInbox } = useSidebarNavigation()
</script>

<template>
  <nav
    data-testid="sidebar-navigation"
    class="sidebar-navigation-shell flex flex-col"
  >
    <SidebarNavigationItem
      navigation-id="inbox"
      icon="inbox"
      :label="$t('sidebarNavigation.inbox')"
      :selected="selectedView.kind === 'inbox'"
      :accent-color="accentColor"
      @click="selectInbox"
    />
  </nav>
</template>
