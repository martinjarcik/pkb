<script setup lang="ts">
const { allTags, tagsExpanded } = useSidebarNavigation()
</script>

<template>
  <section
    v-if="allTags.length > 0"
    data-testid="sidebar-tags"
    class="sidebar-tags-shell flex flex-col"
  >
    <SidebarTagsControls />
    <SidebarTagsList v-if="tagsExpanded" />
  </section>
</template>
