<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ImportPlugin } from '~/import/types'
import {
  useAppConfigDisk,
  type AppConfig,
} from '~/composables/useAppConfigDisk'
import { useAppStartup } from '~/composables/useAppStartup'
import { useLayout } from '~/composables/useLayout'
import { useSettings, type SettingsCategory } from '~/composables/useSettings'
import { useTranslations } from '~/composables/useTranslations'

type LayoutVisibilityKey = 'showSidebarPanel' | 'showNotesListPanel'

const { t } = useTranslations()
const { data: appConfigDisk, saveAppConfigPatch } = useAppConfigDisk()
const { activeCategory, settingsOpen } = useSettings()
const { syncLayoutFromConfig } = useLayout()
const { startApp } = useAppStartup()
const emit = defineEmits<{
  startImport: [plugin: ImportPlugin]
}>()

const saveError = ref<string | null>(null)
const isSaving = ref(false)
const vaultDraft = ref('')
const assetsFolderDraft = ref('')
const trashRetentionDaysDraft = ref('')
const autosaveDelayDraft = ref('')

const categoryItems = computed<
  Array<{ id: SettingsCategory; label: string; description: string }>
>(() => [
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
  {
    id: 'general',
    label: t('settings.categories.general'),
    description: t('settings.categories.generalDescription'),
  },
])

const editorColors = computed(() =>
  Object.entries(appConfigDisk.value.editorColors),
)

function syncDrafts(config: AppConfig): void {
  vaultDraft.value = config.vault
  assetsFolderDraft.value = config.editor.assetsFolder
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

async function makeRelativeToVault(
  vault: string,
  absolutePath: string,
): Promise<string> {
  const { invoke } = await import('@tauri-apps/api/core')

  return invoke<string>('make_relative_to_vault', {
    vault,
    absolutePath,
  })
}

async function chooseAssetsFolderDirectory(): Promise<void> {
  const vaultAbsolute = await resolveAbsoluteVaultPath(
    appConfigDisk.value.vault,
  )
  const currentAssetsFolder = appConfigDisk.value.editor.assetsFolder
  const defaultPath = currentAssetsFolder
    ? `${vaultAbsolute}/${currentAssetsFolder}`
    : vaultAbsolute

  const selectedDirectory = await openDirectoryDialog(defaultPath)

  if (!selectedDirectory) {
    return
  }

  const relativePath = await makeRelativeToVault(
    appConfigDisk.value.vault,
    selectedDirectory.trim(),
  )

  if (
    relativePath.length === 0 ||
    relativePath === appConfigDisk.value.editor.assetsFolder
  ) {
    assetsFolderDraft.value = appConfigDisk.value.editor.assetsFolder
    return
  }

  await savePatch({ editor: { assetsFolder: relativePath } })
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
  key: LayoutVisibilityKey,
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

async function updateSidebarBackgroundColor(color: string): Promise<void> {
  if (color === appConfigDisk.value.theme.sidebarBackgroundColor) {
    return
  }

  await savePatch({ theme: { sidebarBackgroundColor: color } })
}

async function updateSidebarBadge(badge: string): Promise<void> {
  if (badge === appConfigDisk.value.theme.sidebarBadge) {
    return
  }

  await savePatch({ theme: { sidebarBadge: badge } })
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

async function updateApplicationTypeface(value: string): Promise<void> {
  if (
    value.length === 0 ||
    value === appConfigDisk.value.theme.typography.application.typeface
  ) {
    return
  }

  await savePatch({
    theme: {
      typography: {
        application: {
          typeface: value,
        },
      },
    },
  })
}

async function updateApplicationFontSize(value: string): Promise<void> {
  if (
    value.length === 0 ||
    value === appConfigDisk.value.theme.typography.application.fontSize
  ) {
    return
  }

  await savePatch({
    theme: {
      typography: {
        application: {
          fontSize: value,
        },
      },
    },
  })
}

async function updateEditorTypeface(value: string): Promise<void> {
  if (
    value.length === 0 ||
    value === appConfigDisk.value.theme.typography.editor.typeface
  ) {
    return
  }

  await savePatch({
    theme: {
      typography: {
        editor: {
          typeface: value,
        },
      },
    },
  })
}

async function updateEditorFontSize(value: string): Promise<void> {
  if (
    value.length === 0 ||
    value === appConfigDisk.value.theme.typography.editor.fontSize
  ) {
    return
  }

  await savePatch({
    theme: {
      typography: {
        editor: {
          fontSize: value,
        },
      },
    },
  })
}

function handleFeatureChecked(
  key: keyof AppConfig['features'],
  checked: boolean,
): void {
  void updateFeature(key, checked)
}

function handleLayoutChecked(key: LayoutVisibilityKey, checked: boolean): void {
  void updateLayout(key, checked)
}

function handleDefaultEditorColorSelected(value: string | undefined): void {
  void updateDefaultEditorColor(String(value ?? ''))
}

function handleApplicationTypefaceSelected(value: string | undefined): void {
  void updateApplicationTypeface(String(value ?? ''))
}

function handleApplicationFontSizeSelected(value: string | undefined): void {
  void updateApplicationFontSize(String(value ?? ''))
}

function handleEditorTypefaceSelected(value: string | undefined): void {
  void updateEditorTypeface(String(value ?? ''))
}

function handleEditorFontSizeSelected(value: string | undefined): void {
  void updateEditorFontSize(String(value ?? ''))
}

function handleStartImport(plugin: ImportPlugin): void {
  settingsOpen.value = false
  emit('startImport', plugin)
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
          <SettingsFeaturesSection
            v-if="activeCategory === 'features'"
            :app-config="appConfigDisk"
            :is-saving="isSaving"
            @update-feature="handleFeatureChecked"
            @update-layout="handleLayoutChecked"
          />

          <SettingsEditingSection
            v-else-if="activeCategory === 'editing'"
            :app-config="appConfigDisk"
            :is-saving="isSaving"
            :trash-retention-days-draft="trashRetentionDaysDraft"
            :autosave-delay-draft="autosaveDelayDraft"
            :editor-colors="editorColors"
            @update:trash-retention-days-draft="
              trashRetentionDaysDraft = $event
            "
            @update:autosave-delay-draft="autosaveDelayDraft = $event"
            @commit-trash-retention-days="void commitTrashRetentionDays()"
            @commit-autosave-delay="void commitAutosaveDelay()"
            @select-default-editor-color="handleDefaultEditorColorSelected"
          />

          <SettingsThemeSection
            v-else-if="activeCategory === 'theme'"
            :app-config="appConfigDisk"
            :is-saving="isSaving"
            @update-accent-color="void updateAccentColor($event)"
            @update-sidebar-background-color="
              void updateSidebarBackgroundColor($event)
            "
            @update-sidebar-badge="void updateSidebarBadge($event)"
            @update-application-typeface="handleApplicationTypefaceSelected"
            @update-application-font-size="handleApplicationFontSizeSelected"
            @update-editor-typeface="handleEditorTypefaceSelected"
            @update-editor-font-size="handleEditorFontSizeSelected"
          />

          <SettingsGeneralSection
            v-else-if="activeCategory === 'general'"
            :is-saving="isSaving"
            :vault-draft="vaultDraft"
            :assets-folder-draft="assetsFolderDraft"
            @choose-vault="void chooseVaultDirectory()"
            @choose-assets-folder="void chooseAssetsFolderDirectory()"
            @start-import="handleStartImport"
          />
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
