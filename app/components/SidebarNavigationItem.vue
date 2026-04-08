<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  navigationId: string
  icon: Component | string
  label: string
  selected: boolean
  dropActive?: boolean
}>()
const emit = defineEmits<{
  activate: []
}>()

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
    @click="handleClick"
  >
    <span
      v-if="typeof icon === 'string'"
      class="sidebar-navigation-item-icon inline-flex w-[15px] shrink-0 items-center justify-center text-[15px] leading-none"
      aria-hidden="true"
    >{{ icon }}</span>
    <component
      :is="icon"
      v-else
      :size="15"
      class="sidebar-navigation-item-icon"
      aria-hidden="true"
    />
    <span class="sidebar-navigation-item-label">{{ label }}</span>
  </button>
</template>
