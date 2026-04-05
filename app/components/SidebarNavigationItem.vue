<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = defineProps<{
  navigationId: string
  icon: Component | string
  label: string
  selected: boolean
  accentColor: string
  dropActive?: boolean
}>()
const emit = defineEmits<{
  activate: []
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
