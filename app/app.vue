<script setup lang="ts">
import { loadConfig } from '~/config/loader'

const appConfig = loadConfig()
const themeAccentColor = appConfig.theme.accentColor

const fallbackLocale = 'en'
const configuredLocale = appConfig.locale
const { availableLocales, locale } = useI18n()
const matchedLocale = availableLocales.find(
  (availableLocale) => availableLocale === configuredLocale,
)

locale.value = matchedLocale ?? fallbackLocale
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
