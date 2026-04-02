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

const isHighlighted = computed(() => props.state !== 'idle')

const highlightStyle = computed(() =>
  isHighlighted.value ? { color: props.accentColor } : undefined,
)

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
      'sidebar-tag-item-selected': isHighlighted,
      'sidebar-tag-item-pinned': state === 'pinned',
    }"
    :style="highlightStyle"
    @click="handleClick"
  >
    {{ `#${tag}` }}
  </button>
</template>
