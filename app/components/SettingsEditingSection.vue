<script setup lang="ts">
import { useTranslations } from '~/composables/useTranslations'
import type { AppConfig } from '~/composables/useAppConfigDisk'

defineProps<{
  appConfig: AppConfig
  isSaving: boolean
  trashRetentionDaysDraft: string
  autosaveDelayDraft: string
  editorColors: Array<[string, AppConfig['editorColors'][string]]>
}>()

const emit = defineEmits<{
  'update:trashRetentionDaysDraft': [value: string]
  'update:autosaveDelayDraft': [value: string]
  commitTrashRetentionDays: []
  commitAutosaveDelay: []
  selectDefaultEditorColor: [value: string | undefined]
}>()

const { t } = useTranslations()

function handleEnterKey(
  event: KeyboardEvent,
  action: 'commitTrashRetentionDays' | 'commitAutosaveDelay',
): void {
  if (event.key !== 'Enter') {
    return
  }

  event.preventDefault()

  if (action === 'commitTrashRetentionDays') {
    emit('commitTrashRetentionDays')
    return
  }

  emit('commitAutosaveDelay')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="space-y-2">
      <Label for="settings-trash-retention-days">
        {{ t('settings.fields.trashRetentionDays.label') }}
      </Label>
      <Input
        id="settings-trash-retention-days"
        :model-value="trashRetentionDaysDraft"
        :disabled="isSaving"
        min="1"
        type="number"
        @update:model-value="
          emit('update:trashRetentionDaysDraft', String($event))
        "
        @blur="$emit('commitTrashRetentionDays')"
        @keydown="handleEnterKey($event, 'commitTrashRetentionDays')"
      />
      <p class="text-sm text-muted-foreground">
        {{ t('settings.fields.trashRetentionDays.description') }}
      </p>
    </div>

    <div class="space-y-2">
      <Label for="settings-autosave-delay">
        {{ t('settings.fields.autosaveDelay.label') }}
      </Label>
      <Input
        id="settings-autosave-delay"
        :model-value="autosaveDelayDraft"
        :disabled="isSaving"
        min="0"
        step="100"
        type="number"
        @update:model-value="emit('update:autosaveDelayDraft', String($event))"
        @blur="$emit('commitAutosaveDelay')"
        @keydown="handleEnterKey($event, 'commitAutosaveDelay')"
      />
      <p class="text-sm text-muted-foreground">
        {{ t('settings.fields.autosaveDelay.description') }}
      </p>
    </div>

    <div class="space-y-2">
      <Label for="settings-default-editor-color">
        {{ t('settings.fields.defaultEditorColor.label') }}
      </Label>
      <Select
        :disabled="isSaving"
        :model-value="appConfig.theme.defaultEditorColor"
        @update:model-value="emit('selectDefaultEditorColor', $event)"
      >
        <SelectTrigger id="settings-default-editor-color">
          <SelectValue
            :placeholder="t('settings.fields.defaultEditorColor.placeholder')"
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="[colorName, colorMeta] in editorColors"
            :key="colorName"
            :value="colorName"
          >
            {{ colorMeta.emoji }} {{ colorMeta.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.fields.defaultEditorColor.description') }}
      </p>
    </div>

    <Separator />

    <div class="space-y-4">
      <div class="space-y-1">
        <h3 class="text-sm font-semibold">
          {{ t('settings.fields.editorColors.label') }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ t('settings.fields.editorColors.description') }}
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="[colorName, colorMeta] in editorColors"
          :key="colorName"
          class="rounded-lg border border-border p-3"
        >
          <div class="flex items-center gap-3">
            <div
              class="h-10 w-10 rounded-md border border-border"
              :style="{ backgroundColor: colorMeta.background }"
            />
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">
                {{ colorMeta.emoji }} {{ colorMeta.label }}
              </p>
              <p class="truncate text-xs text-muted-foreground">
                {{ colorName }}
              </p>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-2 text-xs">
            <span
              class="rounded px-2 py-1"
              :style="{
                backgroundColor: colorMeta.background,
                color: colorMeta.text,
              }"
            >
              Aa
            </span>
            <span class="text-muted-foreground">
              {{ colorMeta.background }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
