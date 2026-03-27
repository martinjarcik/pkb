<script setup lang="ts">
import { loadConfig } from '~/config/loader'

const appConfig = loadConfig()
const themeAccentColor = appConfig.theme.accentColor
</script>

<template>
  <div
    class="h-screen min-h-0"
    :style="{ '--app-config-accent-color': themeAccentColor }"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
