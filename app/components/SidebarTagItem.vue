<script setup lang="ts">
import { computed } from 'vue'
import type { TagFilterState } from '~/composables/useSidebarNavigation'

const props = defineProps<{
  tag: string
  state: TagFilterState
  accentColor: string
}>()

const emit = defineEmits<{
  click: []
}>()

const highlightStyle = computed(() => {
  if (props.state === 'selected') {
    return { backgroundColor: props.accentColor, color: '#fff' }
  }

  if (props.state === 'excluded') {
    return { borderColor: props.accentColor, color: props.accentColor }
  }

  return undefined
})

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
    :style="highlightStyle"
    @click="handleClick"
  >
    {{ `#${tag}` }}
  </button>
</template>
