<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AppConfig } from '~/config/parseAppConfig'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useAppStartup } from '~/composables/useAppStartup'
import { useLayout } from '~/composables/useLayout'
import { useSettings, type SettingsCategory } from '~/composables/useSettings'
import { useTranslations } from '~/composables/useTranslations'

const { t } = useTranslations()
const { data: appConfigDisk, saveAppConfigPatch } = useAppConfigDisk()
const { activeCategory, settingsOpen } = useSettings()
const { syncLayoutFromConfig } = useLayout()
const { startApp } = useAppStartup()

const saveError = ref<string | null>(null)
const isSaving = ref(false)
const vaultDraft = ref('')
const trashRetentionDaysDraft = ref('')
const autosaveDelayDraft = ref('')

const categoryItems = computed<
  Array<{ id: SettingsCategory; label: string; description: string }>
>(() => [
  {
    id: 'general',
    label: t('settings.categories.general'),
    description: t('settings.categories.generalDescription'),
  },
  {
    id: 'features',
    label: t('settings.categories.features'),
    description: t('settings.categories.featuresDescription'),
  },
  {
    id: 'editing',
    label: t('settings.categories.editing'),
    description: t('settings.categories.editingDescription'),
  },
  {
    id: 'theme',
    label: t('settings.categories.theme'),
    description: t('settings.categories.themeDescription'),
  },
])

const editorColors = computed(() =>
  Object.entries(appConfigDisk.value.editorColors),
)

function syncDrafts(config: AppConfig): void {
  vaultDraft.value = config.vault
  trashRetentionDaysDraft.value = String(config.notes.trashRetentionDays)
  autosaveDelayDraft.value = String(config.editor.autosaveDelay)
}

watch(
  () => appConfigDisk.value,
  (config) => {
    syncDrafts(config)
  },
  {
    deep: true,
    immediate: true,
  },
)

async function savePatch(
  patch: Record<string, unknown>,
  options?: { restartApp?: boolean },
): Promise<void> {
  saveError.value = null
  isSaving.value = true

  try {
    const updated = await saveAppConfigPatch(patch)

    syncLayoutFromConfig(updated.layout)
    syncDrafts(updated)

    if (options?.restartApp) {
      await startApp()
    }
  } catch (error) {
    saveError.value =
      error instanceof Error ? error.message : t('settings.errors.saveFailed')
    syncDrafts(appConfigDisk.value)
  } finally {
    isSaving.value = false
  }
}

async function openDirectoryDialog(
  defaultPath?: string,
): Promise<string | null> {
  const { open } = await import('@tauri-apps/plugin-dialog')
  const result = await open({
    defaultPath,
    directory: true,
    multiple: false,
  })

  return typeof result === 'string' ? result : null
}

async function resolveAbsoluteVaultPath(vaultPath: string): Promise<string> {
  const { invoke } = await import('@tauri-apps/api/core')

  return invoke<string>('resolve_vault', {
    dir: vaultPath,
  })
}

async function chooseVaultDirectory(): Promise<void> {
  const defaultPath = await resolveAbsoluteVaultPath(appConfigDisk.value.vault)
  const selectedDirectory = await openDirectoryDialog(defaultPath)

  if (!selectedDirectory) {
    return
  }

  const nextVault = selectedDirectory.trim()

  if (nextVault.length === 0 || nextVault === appConfigDisk.value.vault) {
    vaultDraft.value = appConfigDisk.value.vault
    return
  }

  await savePatch({ vault: nextVault }, { restartApp: true })
}

async function updateFeature(
  key: keyof AppConfig['features'],
  checked: boolean,
): Promise<void> {
  if (checked === appConfigDisk.value.features[key]) {
    return
  }

  await savePatch({ features: { [key]: checked } })
}

async function updateLayout(
  key: keyof AppConfig['layout'],
  checked: boolean,
): Promise<void> {
  if (checked === appConfigDisk.value.layout[key]) {
    return
  }

  await savePatch({ layout: { [key]: checked } })
}

async function commitTrashRetentionDays(): Promise<void> {
  const trimmed = trashRetentionDaysDraft.value.trim()
  const nextValue = Number(trimmed)

  if (
    trimmed.length === 0 ||
    !Number.isInteger(nextValue) ||
    nextValue < 1 ||
    nextValue === appConfigDisk.value.notes.trashRetentionDays
  ) {
    trashRetentionDaysDraft.value = String(
      appConfigDisk.value.notes.trashRetentionDays,
    )
    return
  }

  await savePatch({ notes: { trashRetentionDays: nextValue } })
}

async function commitAutosaveDelay(): Promise<void> {
  const trimmed = autosaveDelayDraft.value.trim()
  const nextValue = Number(trimmed)

  if (
    trimmed.length === 0 ||
    !Number.isFinite(nextValue) ||
    nextValue < 0 ||
    nextValue === appConfigDisk.value.editor.autosaveDelay
  ) {
    autosaveDelayDraft.value = String(appConfigDisk.value.editor.autosaveDelay)
    return
  }

  await savePatch({ editor: { autosaveDelay: nextValue } })
}

async function updateAccentColor(color: string): Promise<void> {
  if (color === appConfigDisk.value.theme.accentColor) {
    return
  }

  await savePatch({ theme: { accentColor: color } })
}

async function updateDefaultEditorColor(color: string): Promise<void> {
  if (
    color.length === 0 ||
    color === appConfigDisk.value.theme.defaultEditorColor
  ) {
    return
  }

  await savePatch({ theme: { defaultEditorColor: color } })
}

function handleFeatureChecked(
  key: keyof AppConfig['features'],
  checked: boolean,
): void {
  void updateFeature(key, checked)
}

function handleLayoutChecked(
  key: keyof AppConfig['layout'],
  checked: boolean,
): void {
  void updateLayout(key, checked)
}

function handleDefaultEditorColorSelected(value: string | undefined): void {
  void updateDefaultEditorColor(String(value ?? ''))
}

function handleTextInputKeydown(
  event: KeyboardEvent,
  commit: () => Promise<void>,
): void {
  if (event.key !== 'Enter') {
    return
  }

  event.preventDefault()
  void commit()
}
</script>

<template>
  <Dialog v-model:open="settingsOpen">
    <DialogScrollContent class="sm:max-w-[880px]">
      <DialogHeader>
        <DialogTitle>{{ t('settings.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('settings.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex h-[560px] min-h-0 gap-6">
        <div class="flex w-44 shrink-0 flex-col gap-2">
          <button
            v-for="category in categoryItems"
            :key="category.id"
            type="button"
            class="rounded-lg px-3 py-2 text-left transition-colors"
            :class="
              activeCategory === category.id
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            "
            @click="activeCategory = category.id"
          >
            <span class="block text-sm font-medium">{{ category.label }}</span>
            <span class="mt-1 block text-xs opacity-80">
              {{ category.description }}
            </span>
          </button>
        </div>

        <Separator orientation="vertical" />

        <div class="min-h-0 flex-1 overflow-y-auto px-1 py-1">
          <div
            v-if="activeCategory === 'general'"
            class="flex flex-col gap-6"
          >
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
                  @click="void chooseVaultDirectory()"
                />
                <Button
                  type="button"
                  variant="outline"
                  :disabled="isSaving"
                  @click="void chooseVaultDirectory()"
                >
                  {{ t('settings.actions.chooseDirectory') }}
                </Button>
              </div>
              <p class="text-sm text-muted-foreground">
                {{ t('settings.fields.vault.description') }}
              </p>
            </div>
          </div>

          <div
            v-else-if="activeCategory === 'features'"
            class="flex flex-col gap-6"
          >
            <div class="space-y-4">
              <h3 class="text-sm font-semibold">
                {{ t('settings.sections.features') }}
              </h3>

              <div
                v-for="feature in [
                  {
                    key: 'favorites',
                    label: t('settings.fields.features.favorites.label'),
                    description: t(
                      'settings.fields.features.favorites.description',
                    ),
                    checked: appConfigDisk.features.favorites,
                  },
                  {
                    key: 'tasks',
                    label: t('settings.fields.features.tasks.label'),
                    description: t(
                      'settings.fields.features.tasks.description',
                    ),
                    checked: appConfigDisk.features.tasks,
                  },
                  {
                    key: 'pinned',
                    label: t('settings.fields.features.pinned.label'),
                    description: t(
                      'settings.fields.features.pinned.description',
                    ),
                    checked: appConfigDisk.features.pinned,
                  },
                  {
                    key: 'nonDistractionMode',
                    label: t(
                      'settings.fields.features.nonDistractionMode.label',
                    ),
                    description: t(
                      'settings.fields.features.nonDistractionMode.description',
                    ),
                    checked: appConfigDisk.features.nonDistractionMode,
                  },
                  {
                    key: 'noteWebhook',
                    label: t('settings.fields.features.noteWebhook.label'),
                    description: t(
                      'settings.fields.features.noteWebhook.description',
                    ),
                    checked: appConfigDisk.features.noteWebhook,
                  },
                ]"
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
                  @update:model-value="
                    handleFeatureChecked(
                      feature.key as keyof AppConfig['features'],
                      $event,
                    )
                  "
                />
              </div>
            </div>

            <Separator />

            <div class="space-y-4">
              <h3 class="text-sm font-semibold">
                {{ t('settings.sections.layout') }}
              </h3>

              <div
                v-for="layoutField in [
                  {
                    key: 'showSidebarPanel',
                    label: t('settings.fields.layout.showSidebarPanel.label'),
                    description: t(
                      'settings.fields.layout.showSidebarPanel.description',
                    ),
                    checked: appConfigDisk.layout.showSidebarPanel,
                  },
                  {
                    key: 'showNotesListPanel',
                    label: t('settings.fields.layout.showNotesListPanel.label'),
                    description: t(
                      'settings.fields.layout.showNotesListPanel.description',
                    ),
                    checked: appConfigDisk.layout.showNotesListPanel,
                  },
                  {
                    key: 'showInspectorPanel',
                    label: t('settings.fields.layout.showInspectorPanel.label'),
                    description: t(
                      'settings.fields.layout.showInspectorPanel.description',
                    ),
                    checked: appConfigDisk.layout.showInspectorPanel,
                  },
                ]"
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
                  @update:model-value="
                    handleLayoutChecked(
                      layoutField.key as keyof AppConfig['layout'],
                      $event,
                    )
                  "
                />
              </div>
            </div>
          </div>

          <div
            v-else-if="activeCategory === 'editing'"
            class="flex flex-col gap-6"
          >
            <div class="space-y-2">
              <Label for="settings-trash-retention-days">
                {{ t('settings.fields.trashRetentionDays.label') }}
              </Label>
              <Input
                id="settings-trash-retention-days"
                v-model="trashRetentionDaysDraft"
                :disabled="isSaving"
                min="1"
                type="number"
                @blur="void commitTrashRetentionDays()"
                @keydown="
                  handleTextInputKeydown($event, commitTrashRetentionDays)
                "
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
                v-model="autosaveDelayDraft"
                :disabled="isSaving"
                min="0"
                step="100"
                type="number"
                @blur="void commitAutosaveDelay()"
                @keydown="handleTextInputKeydown($event, commitAutosaveDelay)"
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
                :model-value="appConfigDisk.theme.defaultEditorColor"
                @update:model-value="handleDefaultEditorColorSelected"
              >
                <SelectTrigger id="settings-default-editor-color">
                  <SelectValue
                    :placeholder="
                      t('settings.fields.defaultEditorColor.placeholder')
                    "
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

          <div
            v-else
            class="flex flex-col gap-6"
          >
            <div class="space-y-2">
              <Label for="settings-accent-color">
                {{ t('settings.fields.accentColor.label') }}
              </Label>
              <div class="flex items-center gap-3">
                <Input
                  id="settings-accent-color"
                  class="h-10 w-20 p-1"
                  :disabled="isSaving"
                  :model-value="appConfigDisk.theme.accentColor"
                  type="color"
                  @update:model-value="void updateAccentColor(String($event))"
                />
                <code class="text-sm text-muted-foreground">
                  {{ appConfigDisk.theme.accentColor }}
                </code>
              </div>
              <p class="text-sm text-muted-foreground">
                {{ t('settings.fields.accentColor.description') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p
        v-if="saveError"
        class="text-sm text-destructive"
        role="alert"
      >
        {{ saveError }}
      </p>
    </DialogScrollContent>
  </Dialog>
</template>
