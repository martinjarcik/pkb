<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = defineProps<{
  navigationId: string
  icon: Component
  label: string
  selected: boolean
  accentColor: string
}>()

const selectedStyle = computed(() =>
  props.selected ? { backgroundColor: props.accentColor } : undefined,
)
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
    }"
    :style="selectedStyle"
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
