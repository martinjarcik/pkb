<script setup lang="ts">
import { loadConfig } from '~/config/loader'

const fallbackLocale = 'en'
const configuredLocale = loadConfig().locale
const { availableLocales, locale } = useI18n()
const matchedLocale = availableLocales.find(
  (availableLocale) => availableLocale === configuredLocale,
)

locale.value = matchedLocale ?? fallbackLocale
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
