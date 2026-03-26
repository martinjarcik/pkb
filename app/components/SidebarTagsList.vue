<script setup lang="ts">
const { accentColor, allTags, selectedTags, toggleTag } = useSidebarNavigation()
</script>

<template>
  <div data-testid="sidebar-tags-list" class="sidebar-tags-list-shell">
    <SidebarTagItem
      v-for="tag in allTags"
      :key="tag"
      :tag="tag"
      :selected="selectedTags.includes(tag)"
      :accent-color="accentColor"
      @click="toggleTag(tag)"
    />
  </div>
</template>
