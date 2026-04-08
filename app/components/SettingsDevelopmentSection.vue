<script setup lang="ts">
import { useTranslations } from '~/composables/useTranslations'

const props = defineProps<{
  isSaving: boolean
}>()

const emit = defineEmits<{
  resetApp: []
}>()

const { t } = useTranslations()
</script>

<template>
  <section class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">
        {{ t('settings.sections.development') }}
      </h3>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('settings.sections.developmentDescription') }}
      </p>
    </div>

    <div class="rounded-xl border border-border p-4">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <p class="text-sm font-medium">
            {{ t('settings.fields.resetApp.label') }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ t('settings.fields.resetApp.description') }}
          </p>
        </div>

        <button
          type="button"
          class="rounded-md border border-destructive px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="props.isSaving"
          @click="emit('resetApp')"
        >
          {{ t('settings.actions.reset') }}
        </button>
      </div>
    </div>
  </section>
</template>
