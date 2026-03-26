<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  folderName: string
  selected: boolean
  accentColor: string
}>()

const emit = defineEmits<{
  click: []
}>()

const navigationId = computed(() => `folder:${props.folderName}`)

function handleClick(): void {
  emit('click')
}
</script>

<template>
  <SidebarNavigationItem
    :navigation-id="navigationId"
    icon="folder"
    :label="folderName"
    :selected="selected"
    :accent-color="accentColor"
    @click="handleClick"
  />
</template>
