<script setup lang="ts">
import { appleNotesPlugin } from '~/import/appleNotes'
import { appleNotesExporterPlugin } from '~/import/appleNotesExporter'
import { notionPlugin } from '~/import/notion'
import type { ImportPlugin } from '~/import/types'
import { useTranslations } from '~/composables/useTranslations'

defineProps<{
  isSaving: boolean
  vaultDraft: string
  assetsFolderDraft: string
}>()

const emit = defineEmits<{
  chooseVault: []
  chooseAssetsFolder: []
  startImport: [plugin: ImportPlugin]
}>()

const { t } = useTranslations()
const importPlugins = [appleNotesPlugin, appleNotesExporterPlugin, notionPlugin]
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="space-y-2">
      <Label for="settings-vault">
        {{ t('settings.fields.vault.label') }}
      </Label>
      <div class="flex items-center gap-3">
        <Input
          id="settings-vault"
          :disabled="isSaving"
          :model-value="vaultDraft"
          class="cursor-pointer"
          readonly
          @click="$emit('chooseVault')"
        />
        <Button
          type="button"
          variant="outline"
          :disabled="isSaving"
          @click="$emit('chooseVault')"
        >
          {{ t('settings.actions.chooseDirectory') }}
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.fields.vault.description') }}
      </p>
    </div>

    <div class="space-y-2">
      <Label for="settings-assets-folder">
        {{ t('settings.fields.assetsFolder.label') }}
      </Label>
      <div class="flex items-center gap-3">
        <Input
          id="settings-assets-folder"
          :disabled="isSaving"
          :model-value="assetsFolderDraft"
          class="cursor-pointer"
          readonly
          @click="$emit('chooseAssetsFolder')"
        />
        <Button
          type="button"
          variant="outline"
          :disabled="isSaving"
          @click="$emit('chooseAssetsFolder')"
        >
          {{ t('settings.actions.chooseDirectory') }}
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.fields.assetsFolder.description') }}
      </p>
    </div>

    <div class="space-y-3">
      <Label>{{ t('settings.sections.import') }}</Label>
      <div class="flex flex-wrap gap-3">
        <Button
          v-for="plugin in importPlugins"
          :key="plugin.id"
          type="button"
          variant="outline"
          :disabled="isSaving"
          @click="emit('startImport', plugin)"
        >
          {{ plugin.label }}
        </Button>
      </div>
    </div>
  </div>
</template>
