<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = defineProps<{
  navigationId: string
  icon: Component
  label: string
  selected: boolean
  accentColor: string
  dropActive?: boolean
}>()
const emit = defineEmits<{
  activate: []
  dragenter: [event: DragEvent]
  dragleave: [event: DragEvent]
  dragover: [event: DragEvent]
  drop: [event: DragEvent]
}>()

const selectedStyle = computed(() =>
  props.selected ? { backgroundColor: props.accentColor } : undefined,
)

function handleClick(): void {
  emit('activate')
}
</script>

<template>
  <button
    type="button"
    :data-navigation-id="navigationId"
    :data-selected="selected ? 'true' : 'false'"
    data-testid="sidebar-navigation-item"
    class="sidebar-navigation-item-shell"
    :class="{
      'sidebar-navigation-item-selected': selected,
      'sidebar-navigation-item-drop-active': dropActive,
    }"
    :data-drop-active="dropActive ? 'true' : 'false'"
    :style="selectedStyle"
    @click="handleClick"
    @dragenter="emit('dragenter', $event)"
    @dragleave="emit('dragleave', $event)"
    @dragover="emit('dragover', $event)"
    @drop="emit('drop', $event)"
  >
    <component
      :is="icon"
      :size="12"
      class="sidebar-navigation-item-icon"
      aria-hidden="true"
    />
    <span class="sidebar-navigation-item-label">{{ label }}</span>
  </button>
</template>
