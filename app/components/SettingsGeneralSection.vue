<script setup lang="ts">
import { useTranslations } from '~/composables/useTranslations'

defineProps<{
  isSaving: boolean
  vaultDraft: string
  assetsFolderDraft: string
}>()

defineEmits<{
  chooseVault: []
  chooseAssetsFolder: []
}>()

const { t } = useTranslations()
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
  </div>
</template>
