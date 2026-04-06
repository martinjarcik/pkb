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
  </div>
</template>
