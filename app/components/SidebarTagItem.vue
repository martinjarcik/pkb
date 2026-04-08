<script setup lang="ts">
import type { TagFilterState } from '~/composables/useSidebarNavigation'

defineProps<{
  tag: string
  state: TagFilterState
}>()

const emit = defineEmits<{
  click: []
}>()

function handleClick(): void {
  emit('click')
}
</script>

<template>
  <button
    type="button"
    :data-tag="tag"
    :data-state="state"
    data-testid="sidebar-tag-item"
    class="sidebar-tag-item-shell"
    :class="{
      'sidebar-tag-item-selected': state === 'selected',
      'sidebar-tag-item-excluded': state === 'excluded',
    }"
    @click="handleClick"
  >
    {{ `#${tag}` }}
  </button>
</template>
