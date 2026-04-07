<script setup lang="ts">
import { ref } from 'vue'
import { Smile } from 'lucide-vue-next'
import 'emoji-picker-element'
import { useTranslations } from '~/composables/useTranslations'
import type { AppConfig } from '~/composables/useAppConfigDisk'

type TypographyOption = {
  label: string
  value: string
}

defineProps<{
  appConfig: AppConfig
  isSaving: boolean
}>()

const emit = defineEmits<{
  updateAccentColor: [value: string]
  updateSidebarBackgroundColor: [value: string]
  updateSidebarTextColor: [value: string]
  updateSidebarBadge: [value: string]
  updateApplicationTypeface: [value: string | undefined]
  updateApplicationFontSize: [value: string | undefined]
  updateEditorTypeface: [value: string | undefined]
  updateEditorFontSize: [value: string | undefined]
}>()

const { t } = useTranslations()
const pickerOpen = ref(false)

const typefaceOptions: TypographyOption[] = [
  {
    label: 'System Sans',
    value:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  {
    label: 'Inter',
    value: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  {
    label: 'Lora',
    value: '"Lora", Georgia, "Times New Roman", serif',
  },
  {
    label: 'Courier New',
    value: '"Courier New", Courier, monospace',
  },
  {
    label: 'Monospace',
    value: 'monospace',
  },
]

const fontSizeOptions: TypographyOption[] = [
  { label: '12 px', value: '12px' },
  { label: '13 px', value: '13px' },
  { label: '14 px', value: '14px' },
  { label: '15 px', value: '15px' },
  { label: '16 px', value: '16px' },
  { label: '17 px', value: '17px' },
  { label: '18 px', value: '18px' },
  { label: '19 px', value: '19px' },
  { label: '20 px', value: '20px' },
  { label: '21 px', value: '21px' },
  { label: '22 px', value: '22px' },
  { label: '23 px', value: '23px' },
  { label: '24 px', value: '24px' },
]

function handleEmojiClick(event: Event): void {
  const detail = (event as CustomEvent<{ unicode: string }>).detail

  emit('updateSidebarBadge', detail.unicode)
  pickerOpen.value = false
}

function bindPicker(el: HTMLElement | null): void {
  const picker = el?.querySelector('emoji-picker')

  picker?.addEventListener('emoji-click', handleEmojiClick)
}

function clearSidebarBadge(): void {
  emit('updateSidebarBadge', '')
  pickerOpen.value = false
}
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

    <div class="space-y-2">
      <Label for="settings-sidebar-badge">
        {{ t('settings.fields.sidebarBadge.label') }}
      </Label>
      <div class="flex items-center gap-3">
        <Popover v-model:open="pickerOpen">
          <PopoverTrigger as-child>
            <Button
              id="settings-sidebar-badge"
              type="button"
              variant="outline"
              class="h-10 w-10 p-0"
              :disabled="isSaving"
              :aria-label="t('settings.fields.sidebarBadge.pick')"
            >
              <span
                v-if="appConfig.theme.sidebarBadge.length > 0"
                class="text-xl"
                style="font-family: 'Noto Emoji', sans-serif"
              >
                {{ appConfig.theme.sidebarBadge }}
              </span>
              <Smile
                v-else
                :size="18"
                aria-hidden="true"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto max-w-[min(100vw-2rem,22rem)] p-0">
            <div :ref="(el: any) => bindPicker(el as HTMLElement)">
              <emoji-picker
                class="folder-emoji-picker"
                style="--emoji-font-family: 'Noto Emoji', sans-serif"
              />
            </div>
          </PopoverContent>
        </Popover>
        <Button
          v-if="appConfig.theme.sidebarBadge.length > 0"
          type="button"
          variant="ghost"
          size="sm"
          :disabled="isSaving"
          @click="clearSidebarBadge"
        >
          {{ t('settings.fields.sidebarBadge.clear') }}
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.fields.sidebarBadge.description') }}
      </p>
    </div>

    <div class="space-y-3">
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
        <div class="space-y-2">
          <Label for="settings-application-typeface">
            {{ t('settings.fields.applicationTypography.label') }}
          </Label>
          <Select
            :disabled="isSaving"
            :model-value="appConfig.theme.typography.application.typeface"
            @update:model-value="emit('updateApplicationTypeface', $event)"
          >
            <SelectTrigger id="settings-application-typeface">
              <SelectValue
                :placeholder="
                  t('settings.fields.applicationTypography.typefacePlaceholder')
                "
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in typefaceOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="settings-application-font-size">
            {{ t('settings.fields.textSize.label') }}
          </Label>
          <Select
            :disabled="isSaving"
            :model-value="appConfig.theme.typography.application.fontSize"
            @update:model-value="emit('updateApplicationFontSize', $event)"
          >
            <SelectTrigger id="settings-application-font-size">
              <SelectValue
                :placeholder="
                  t('settings.fields.applicationTypography.sizePlaceholder')
                "
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in fontSizeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.fields.applicationTypography.description') }}
      </p>
    </div>

    <div class="space-y-3">
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
        <div class="space-y-2">
          <Label for="settings-editor-typeface">
            {{ t('settings.fields.editorTypography.label') }}
          </Label>
          <Select
            :disabled="isSaving"
            :model-value="appConfig.theme.typography.editor.typeface"
            @update:model-value="emit('updateEditorTypeface', $event)"
          >
            <SelectTrigger id="settings-editor-typeface">
              <SelectValue
                :placeholder="
                  t('settings.fields.editorTypography.typefacePlaceholder')
                "
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in typefaceOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="settings-editor-font-size">
            {{ t('settings.fields.textSize.label') }}
          </Label>
          <Select
            :disabled="isSaving"
            :model-value="appConfig.theme.typography.editor.fontSize"
            @update:model-value="emit('updateEditorFontSize', $event)"
          >
            <SelectTrigger id="settings-editor-font-size">
              <SelectValue
                :placeholder="
                  t('settings.fields.editorTypography.sizePlaceholder')
                "
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in fontSizeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.fields.editorTypography.description') }}
      </p>
    </div>
  </div>
</template>
