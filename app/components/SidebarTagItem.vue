<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  tag: string
  selected: boolean
  accentColor: string
}>()

const emit = defineEmits<{
  click: []
}>()

const selectedStyle = computed(() =>
  props.selected ? { color: props.accentColor } : undefined,
)

function handleClick(): void {
  emit('click')
}
</script>

<template>
  <button
    type="button"
    :data-tag="tag"
    :data-selected="selected ? 'true' : 'false'"
    data-testid="sidebar-tag-item"
    class="sidebar-tag-item-shell"
    :class="{
      'sidebar-tag-item-selected': selected,
    }"
    :style="selectedStyle"
    @click="handleClick"
  >
    {{ `#${tag}` }}
  </button>
</template>
