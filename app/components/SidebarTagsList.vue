<script setup lang="ts">
import { tagFilterState } from '~/composables/useSidebarNavigation'

const { accentColor, allTags, selectedView, cycleTag } = useSidebarNavigation()
</script>

<template>
  <div data-testid="sidebar-tags-list" class="sidebar-tags-list-shell">
    <SidebarTagItem
      v-for="tag in allTags"
      :key="tag"
      :tag="tag"
      :state="tagFilterState(selectedView, tag)"
      :accent-color="accentColor"
      @click="cycleTag(tag)"
    />
  </div>
</template>
