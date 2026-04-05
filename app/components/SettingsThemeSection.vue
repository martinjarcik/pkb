<script setup lang="ts">
import { useTranslations } from '~/composables/useTranslations'
import type { AppConfig } from '~/composables/useAppConfigDisk'

defineProps<{
  appConfig: AppConfig
  isSaving: boolean
}>()

const emit = defineEmits<{
  updateAccentColor: [value: string]
  updateSidebarBackgroundColor: [value: string]
  updateSidebarTextColor: [value: string]
}>()

const { t } = useTranslations()
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="space-y-2">
      <Label for="settings-accent-color">
        {{ t('settings.fields.accentColor.label') }}
      </Label>
      <div class="flex items-center gap-3">
        <Input
          id="settings-accent-color"
          class="h-10 w-20 p-1"
          :disabled="isSaving"
          :model-value="appConfig.theme.accentColor"
          type="color"
          @update:model-value="emit('updateAccentColor', String($event))"
        />
        <code class="text-sm text-muted-foreground">
          {{ appConfig.theme.accentColor }}
        </code>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.fields.accentColor.description') }}
      </p>
    </div>

    <div class="space-y-2">
      <Label for="settings-sidebar-background-color">
        {{ t('settings.fields.sidebarBackgroundColor.label') }}
      </Label>
      <div class="flex items-center gap-3">
        <Input
          id="settings-sidebar-background-color"
          class="h-10 w-20 p-1"
          :disabled="isSaving"
          :model-value="appConfig.theme.sidebarBackgroundColor"
          type="color"
          @update:model-value="
            emit('updateSidebarBackgroundColor', String($event))
          "
        />
        <code class="text-sm text-muted-foreground">
          {{ appConfig.theme.sidebarBackgroundColor }}
        </code>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.fields.sidebarBackgroundColor.description') }}
      </p>
    </div>

    <div class="space-y-2">
      <Label for="settings-sidebar-text-color">
        {{ t('settings.fields.sidebarTextColor.label') }}
      </Label>
      <div class="flex items-center gap-3">
        <Input
          id="settings-sidebar-text-color"
          class="h-10 w-20 p-1"
          :disabled="isSaving"
          :model-value="appConfig.theme.sidebarTextColor"
          type="color"
          @update:model-value="emit('updateSidebarTextColor', String($event))"
        />
        <code class="text-sm text-muted-foreground">
          {{ appConfig.theme.sidebarTextColor }}
        </code>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.fields.sidebarTextColor.description') }}
      </p>
    </div>
  </div>
</template>
