<script setup lang="ts">
const { accentColor } = useAppTheme()
</script>

<template>
  <div
    class="h-screen min-h-0"
    :style="{ '--app-config-accent-color': accentColor }"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
