<script setup lang="ts">
import { useAppTheme } from '~/composables/useAppTheme'

const { sidebarBadge } = useAppTheme()
</script>

<template>
  <div
    v-if="sidebarBadge.length > 0"
    aria-hidden="true"
    class="pointer-events-none absolute bottom-[-20px] left-[40%] -translate-x-1/2 select-none text-[180px] leading-none opacity-20"
    style="font-family: 'Noto Emoji', sans-serif"
  >
    <span class="block rotate-[30deg]">{{ sidebarBadge }}</span>
  </div>
</template>
