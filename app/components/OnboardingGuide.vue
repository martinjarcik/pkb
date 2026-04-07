<script setup lang="ts">
import { computed, ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { Check, Cloud, FolderOpen, HardDrive, Smile } from 'lucide-vue-next'
import 'emoji-picker-element'
import { appleNotesPlugin } from '~/import/appleNotes'
import { appleNotesExporterPlugin } from '~/import/appleNotesExporter'
import { notionPlugin } from '~/import/notion'
import type { ImportPlugin } from '~/import/types'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import {
  useOnboarding,
  type OnboardingStorageSelection,
} from '~/composables/useOnboarding'
import { useTranslations } from '~/composables/useTranslations'

type PrepareIcloudVaultResult = {
  status: 'created' | 'name_conflict'
  absolute_path?: string
}

const { t } = useTranslations()
const { data: appConfigDisk } = useAppConfigDisk()
const {
  state,
  defaultVaultPath,
  goToSlide,
  goToNextSlide,
  saveStorageSelection,
  saveAccentColor,
  saveSidebarBadge,
  setSelectedImportPluginId,
  handleImportResult,
  finishOnboarding,
} = useOnboarding()

const importPlugins = [appleNotesPlugin, appleNotesExporterPlugin, notionPlugin]
const importDialogOpen = ref(false)
const activeImportPlugin = ref<ImportPlugin | null>(null)
const actionError = ref<string | null>(null)
const isWorking = ref(false)
const pickerOpen = ref(false)
const icloudFolderName = ref('Notes')
const showIcloudNameInput = ref(false)

const currentSlide = computed(() => state.value.currentSlide)
const selectedImportPluginId = computed(
  () => state.value.selectedImportPluginId,
)

function bindPicker(el: HTMLElement | null): void {
  const picker = el?.querySelector('emoji-picker')

  picker?.addEventListener('emoji-click', handleEmojiClick)
}

function handleEmojiClick(event: Event): void {
  const detail = (event as CustomEvent<{ unicode: string }>).detail

  void saveSidebarBadge(detail.unicode)
  pickerOpen.value = false
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

function resetActionState(): void {
  actionError.value = null
}

async function applyStorageSelection(
  selection: OnboardingStorageSelection,
): Promise<void> {
  resetActionState()
  isWorking.value = true

  try {
    await saveStorageSelection(selection)
    await goToSlide(3)
  } catch (error) {
    actionError.value =
      error instanceof Error ? error.message : t('onboarding.errors.storage')
  } finally {
    isWorking.value = false
  }
}

async function chooseDefaultStorage(): Promise<void> {
  await applyStorageSelection({
    kind: 'default',
    defaultVault: defaultVaultPath,
  })
}

async function chooseCustomStorage(): Promise<void> {
  resetActionState()
  const selectedPath = await openDirectoryDialog(appConfigDisk.value.vault)

  if (!selectedPath) {
    return
  }

  await applyStorageSelection({
    kind: 'custom',
    vault: selectedPath.trim(),
  })
}

async function chooseIcloudStorage(): Promise<void> {
  resetActionState()
  isWorking.value = true

  try {
    const result = await invoke<PrepareIcloudVaultResult>(
      'prepare_icloud_vault',
      {
        folderName: icloudFolderName.value.trim(),
      },
    )

    if (result.status === 'name_conflict') {
      showIcloudNameInput.value = true
      actionError.value = t('onboarding.storage.icloudConflict')
      return
    }

    if (!result.absolute_path) {
      throw new Error(t('onboarding.errors.storage'))
    }

    showIcloudNameInput.value = false
    await applyStorageSelection({
      kind: 'icloud',
      vault: result.absolute_path,
    })
  } catch (error) {
    actionError.value =
      error instanceof Error ? error.message : t('onboarding.errors.storage')
  } finally {
    isWorking.value = false
  }
}

async function startImport(plugin: ImportPlugin): Promise<void> {
  resetActionState()
  activeImportPlugin.value = plugin
  importDialogOpen.value = true
  await setSelectedImportPluginId(plugin.id)
}

async function handleImportCompleted(pluginId: string): Promise<void> {
  importDialogOpen.value = false
  activeImportPlugin.value = null
  await handleImportResult(true, pluginId)
}

async function skipImport(): Promise<void> {
  await goToSlide(4)
}

async function handleFinish(): Promise<void> {
  await finishOnboarding()
}
</script>

<template>
  <div
    class="fixed inset-0 z-[300] flex items-center justify-center bg-background/80 px-6 py-10 backdrop-blur-sm"
  >
    <div
      class="w-full max-w-4xl rounded-3xl border border-border bg-background shadow-2xl"
    >
      <div
        class="flex items-center justify-between border-b border-border px-8 py-5"
      >
        <div>
          <p class="text-sm font-medium text-muted-foreground">
            {{ t('onboarding.stepLabel') }} {{ currentSlide }}/5
          </p>
          <div class="mt-3 flex gap-2">
            <div
              v-for="index in 5"
              :key="index"
              :class="[
                'h-2.5 w-12 rounded-full transition-colors',
                index <= currentSlide ? 'bg-primary' : 'bg-muted',
              ]"
            />
          </div>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ t('onboarding.blocking') }}
        </p>
      </div>

      <div class="min-h-[480px] px-8 py-8">
        <section
          v-if="currentSlide === 1"
          class="flex min-h-[416px] flex-col justify-between gap-10"
        >
          <div class="max-w-2xl space-y-4">
            <p
              class="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground"
            >
              {{ t('onboarding.slides.welcome.eyebrow') }}
            </p>
            <h1 class="text-4xl font-semibold tracking-tight text-foreground">
              {{ t('onboarding.slides.welcome.title') }}
            </h1>
            <p class="text-lg leading-8 text-muted-foreground">
              {{ t('onboarding.slides.welcome.description') }}
            </p>
          </div>

          <div class="flex justify-end">
            <Button
              size="lg"
              @click="void goToNextSlide()"
            >
              {{ t('onboarding.actions.continue') }}
            </Button>
          </div>
        </section>

        <section
          v-else-if="currentSlide === 2"
          class="flex min-h-[416px] flex-col justify-between gap-8"
        >
          <div class="space-y-4">
            <h2 class="text-3xl font-semibold tracking-tight">
              {{ t('onboarding.slides.storage.title') }}
            </h2>
            <p class="max-w-2xl text-base leading-7 text-muted-foreground">
              {{ t('onboarding.slides.storage.description') }}
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <button
              class="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-accent/30"
              type="button"
              :disabled="isWorking"
              @click="void chooseDefaultStorage()"
            >
              <HardDrive class="h-6 w-6 text-primary" />
              <div class="space-y-2">
                <h3 class="text-lg font-semibold">
                  {{ t('onboarding.storage.defaultTitle') }}
                </h3>
                <p class="text-sm leading-6 text-muted-foreground">
                  {{ t('onboarding.storage.defaultDescription') }}
                </p>
              </div>
            </button>

            <button
              class="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-accent/30"
              type="button"
              :disabled="isWorking"
              @click="void chooseIcloudStorage()"
            >
              <Cloud class="h-6 w-6 text-primary" />
              <div class="space-y-2">
                <h3 class="text-lg font-semibold">
                  {{ t('onboarding.storage.icloudTitle') }}
                </h3>
                <p class="text-sm leading-6 text-muted-foreground">
                  {{ t('onboarding.storage.icloudDescription') }}
                </p>
              </div>
            </button>

            <button
              class="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-accent/30"
              type="button"
              :disabled="isWorking"
              @click="void chooseCustomStorage()"
            >
              <FolderOpen class="h-6 w-6 text-primary" />
              <div class="space-y-2">
                <h3 class="text-lg font-semibold">
                  {{ t('onboarding.storage.customTitle') }}
                </h3>
                <p class="text-sm leading-6 text-muted-foreground">
                  {{ t('onboarding.storage.customDescription') }}
                </p>
              </div>
            </button>
          </div>

          <div class="space-y-4">
            <div
              v-if="showIcloudNameInput"
              class="max-w-md space-y-2"
            >
              <Label for="onboarding-icloud-folder">
                {{ t('onboarding.storage.icloudFolderLabel') }}
              </Label>
              <div class="flex gap-3">
                <Input
                  id="onboarding-icloud-folder"
                  v-model="icloudFolderName"
                  :disabled="isWorking"
                />
                <Button
                  variant="outline"
                  :disabled="isWorking || icloudFolderName.trim().length === 0"
                  @click="void chooseIcloudStorage()"
                >
                  {{ t('onboarding.storage.createIcloudFolder') }}
                </Button>
              </div>
            </div>

            <p
              v-if="actionError"
              class="text-sm text-destructive"
              role="alert"
            >
              {{ actionError }}
            </p>

            <div class="flex justify-between">
              <Button
                variant="ghost"
                :disabled="isWorking"
                @click="void goToSlide(1)"
              >
                {{ t('onboarding.actions.back') }}
              </Button>
            </div>
          </div>
        </section>

        <section
          v-else-if="currentSlide === 3"
          class="flex min-h-[416px] flex-col justify-between gap-8"
        >
          <div class="space-y-4">
            <h2 class="text-3xl font-semibold tracking-tight">
              {{ t('onboarding.slides.import.title') }}
            </h2>
            <p class="max-w-2xl text-base leading-7 text-muted-foreground">
              {{ t('onboarding.slides.import.description') }}
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <button
              v-for="plugin in importPlugins"
              :key="plugin.id"
              :class="[
                'rounded-2xl border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-accent/30',
                selectedImportPluginId === plugin.id
                  ? 'border-primary'
                  : 'border-border',
              ]"
              type="button"
              @click="void startImport(plugin)"
            >
              <p class="text-lg font-semibold">
                {{ plugin.label }}
              </p>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                {{ plugin.description }}
              </p>
            </button>
          </div>

          <div class="flex justify-between">
            <Button
              variant="ghost"
              @click="void goToSlide(2)"
            >
              {{ t('onboarding.actions.back') }}
            </Button>
            <Button
              variant="outline"
              @click="void skipImport()"
            >
              {{ t('onboarding.actions.skip') }}
            </Button>
          </div>
        </section>

        <section
          v-else-if="currentSlide === 4"
          class="flex min-h-[416px] flex-col justify-between gap-8"
        >
          <div class="space-y-4">
            <h2 class="text-3xl font-semibold tracking-tight">
              {{ t('onboarding.slides.customization.title') }}
            </h2>
            <p class="max-w-2xl text-base leading-7 text-muted-foreground">
              {{ t('onboarding.slides.customization.description') }}
            </p>
          </div>

          <div class="grid gap-10 md:grid-cols-[220px_minmax(0,1fr)]">
            <div class="space-y-3">
              <Label for="onboarding-accent-color">
                {{ t('onboarding.customization.accentColor') }}
              </Label>
              <div class="flex items-center gap-3">
                <Input
                  id="onboarding-accent-color"
                  class="h-12 w-20 p-1"
                  :model-value="appConfigDisk.theme.accentColor"
                  type="color"
                  @update:model-value="void saveAccentColor(String($event))"
                />
                <code class="text-sm text-muted-foreground">
                  {{ appConfigDisk.theme.accentColor }}
                </code>
              </div>
            </div>

            <div class="space-y-3">
              <Label for="onboarding-sidebar-badge">
                {{ t('onboarding.customization.favoriteEmoji') }}
              </Label>
              <div class="flex items-center gap-3">
                <Popover v-model:open="pickerOpen">
                  <PopoverTrigger as-child>
                    <Button
                      id="onboarding-sidebar-badge"
                      variant="outline"
                      class="h-12 w-12 p-0"
                    >
                      <span
                        v-if="appConfigDisk.theme.sidebarBadge.length > 0"
                        class="text-2xl"
                      >
                        {{ appConfigDisk.theme.sidebarBadge }}
                      </span>
                      <Smile
                        v-else
                        :size="18"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    class="z-[350] w-auto max-w-[min(100vw-2rem,22rem)] p-0"
                  >
                    <div :ref="(el: any) => bindPicker(el as HTMLElement)">
                      <emoji-picker class="folder-emoji-picker" />
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  v-if="appConfigDisk.theme.sidebarBadge.length > 0"
                  variant="ghost"
                  @click="void saveSidebarBadge('')"
                >
                  {{ t('settings.fields.sidebarBadge.clear') }}
                </Button>
              </div>
            </div>
          </div>

          <div class="flex justify-between">
            <Button
              variant="ghost"
              @click="void goToSlide(3)"
            >
              {{ t('onboarding.actions.back') }}
            </Button>
            <Button @click="void goToSlide(5)">
              {{ t('onboarding.actions.continue') }}
            </Button>
          </div>
        </section>

        <section
          v-else
          class="flex min-h-[416px] flex-col justify-between gap-10"
        >
          <div class="max-w-2xl space-y-4">
            <div
              class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Check class="h-6 w-6" />
            </div>
            <h2 class="text-3xl font-semibold tracking-tight">
              {{ t('onboarding.slides.confirmation.title') }}
            </h2>
            <p class="text-base leading-7 text-muted-foreground">
              {{ t('onboarding.slides.confirmation.description') }}
            </p>
          </div>

          <div class="flex justify-between">
            <Button
              variant="ghost"
              @click="void goToSlide(4)"
            >
              {{ t('onboarding.actions.back') }}
            </Button>
            <Button
              size="lg"
              @click="void handleFinish()"
            >
              {{ t('onboarding.actions.finish') }}
            </Button>
          </div>
        </section>
      </div>
    </div>

    <ImportDialog
      v-model:open="importDialogOpen"
      :plugin="activeImportPlugin"
      content-class="z-[350] sm:max-w-[540px]"
      @imported="void handleImportCompleted($event)"
    />
  </div>
</template>
