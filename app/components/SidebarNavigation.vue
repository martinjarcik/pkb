<script setup lang="ts">
const { accentColor, selectedId } = useSidebarNavigation()

function selectInbox(): void {
  selectedId.value = 'inbox'
}
</script>

<template>
  <nav
    data-testid="sidebar-navigation"
    class="sidebar-navigation-shell flex h-full flex-col"
  >
    <SidebarNavigationItem
      navigation-id="inbox"
      icon="inbox"
      :label="$t('sidebarNavigation.inbox')"
      :selected="selectedId === 'inbox'"
      :accent-color="accentColor"
      @click="selectInbox"
    />
  </nav>
</template>
