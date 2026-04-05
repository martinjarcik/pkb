<script setup lang="ts">
import { computed } from 'vue'
import { useTranslations } from '~/composables/useTranslations'
import type { AppConfig } from '~/composables/useAppConfigDisk'

const props = defineProps<{
  appConfig: AppConfig
  isSaving: boolean
}>()

const emit = defineEmits<{
  updateFeature: [key: keyof AppConfig['features'], value: boolean]
  updateLayout: [key: keyof AppConfig['layout'], value: boolean]
}>()

const { t } = useTranslations()

const features = computed(() => [
  {
    key: 'favorites' as const,
    label: t('settings.fields.features.favorites.label'),
    description: t('settings.fields.features.favorites.description'),
    checked: props.appConfig.features.favorites,
  },
  {
    key: 'tasks' as const,
    label: t('settings.fields.features.tasks.label'),
    description: t('settings.fields.features.tasks.description'),
    checked: props.appConfig.features.tasks,
  },
  {
    key: 'pinned' as const,
    label: t('settings.fields.features.pinned.label'),
    description: t('settings.fields.features.pinned.description'),
    checked: props.appConfig.features.pinned,
  },
  {
    key: 'nonDistractionMode' as const,
    label: t('settings.fields.features.nonDistractionMode.label'),
    description: t('settings.fields.features.nonDistractionMode.description'),
    checked: props.appConfig.features.nonDistractionMode,
  },
  {
    key: 'noteWebhook' as const,
    label: t('settings.fields.features.noteWebhook.label'),
    description: t('settings.fields.features.noteWebhook.description'),
    checked: props.appConfig.features.noteWebhook,
  },
])

const layoutFields = computed(() => [
  {
    key: 'showSidebarPanel' as const,
    label: t('settings.fields.layout.showSidebarPanel.label'),
    description: t('settings.fields.layout.showSidebarPanel.description'),
    checked: props.appConfig.layout.showSidebarPanel,
  },
  {
    key: 'showNotesListPanel' as const,
    label: t('settings.fields.layout.showNotesListPanel.label'),
    description: t('settings.fields.layout.showNotesListPanel.description'),
    checked: props.appConfig.layout.showNotesListPanel,
  },
])
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="space-y-4">
      <h3 class="text-sm font-semibold">
        {{ t('settings.sections.features') }}
      </h3>

      <div
        v-for="feature in features"
        :key="feature.key"
        class="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
      >
        <div class="space-y-1">
          <p class="text-sm font-medium">
            {{ feature.label }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ feature.description }}
          </p>
        </div>
        <Switch
          :model-value="feature.checked"
          :disabled="isSaving"
          @update:model-value="emit('updateFeature', feature.key, $event)"
        />
      </div>
    </div>

    <Separator />

    <div class="space-y-4">
      <h3 class="text-sm font-semibold">
        {{ t('settings.sections.layout') }}
      </h3>

      <div
        v-for="layoutField in layoutFields"
        :key="layoutField.key"
        class="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
      >
        <div class="space-y-1">
          <p class="text-sm font-medium">
            {{ layoutField.label }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ layoutField.description }}
          </p>
        </div>
        <Switch
          :model-value="layoutField.checked"
          :disabled="isSaving"
          @update:model-value="emit('updateLayout', layoutField.key, $event)"
        />
      </div>
    </div>
  </div>
</template>
