<script setup lang="ts">
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'

const { allTags, tagFilterState, cycleTag } = useSidebarNavigation()
</script>

<template>
  <div
    data-testid="sidebar-tags-list"
    class="sidebar-tags-list-shell"
  >
    <SidebarTagItem
      v-for="tag in allTags"
      :key="tag"
      :tag="tag"
      :state="tagFilterState(tag)"
      @click="cycleTag(tag)"
    />
  </div>
</template>
