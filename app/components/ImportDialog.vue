<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ImportPlugin } from '~/import/appleNotes'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useNotes } from '~/composables/useNotes'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'
import { useTranslations } from '~/composables/useTranslations'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  plugin: ImportPlugin | null
}>()

const { t } = useTranslations()
const { data: appConfigDisk } = useAppConfigDisk()
const { loadNotes } = useNotes()
const { loadVaultFolders } = useSidebarNavigation()

const selectedDirectory = ref('')
const importError = ref<string | null>(null)
const isImporting = ref(false)

const canImport = computed(() => {
  return (
    props.plugin !== null &&
    selectedDirectory.value.trim().length > 0 &&
    !isImporting.value
  )
})

watch(open, (isOpen) => {
  if (isOpen) {
    importError.value = null
    return
  }

  selectedDirectory.value = ''
  importError.value = null
  isImporting.value = false
})

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

async function chooseDirectory(): Promise<void> {
  const selectedPath = await openDirectoryDialog(
    selectedDirectory.value || undefined,
  )

  if (!selectedPath) {
    return
  }

  selectedDirectory.value = selectedPath.trim()
  importError.value = null
}

async function handleImport(): Promise<void> {
  if (props.plugin === null) {
    return
  }

  const sourceDir = selectedDirectory.value.trim()

  if (sourceDir.length === 0) {
    importError.value = t('import.errors.sourceDirectoryRequired')
    return
  }

  importError.value = null
  isImporting.value = true

  try {
    const resolvedVaultPath = await resolveAbsoluteVaultPath(
      appConfigDisk.value.vault,
    )
    await props.plugin.run(
      sourceDir,
      resolvedVaultPath,
      appConfigDisk.value.editor.assetsFolder,
    )

    await Promise.all([loadNotes(), loadVaultFolders()])
    open.value = false
  } catch (error) {
    importError.value =
      error instanceof Error ? error.message : t('import.errorFallback')
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      v-if="plugin"
      class="sm:max-w-[540px]"
    >
      <DialogHeader>
        <DialogTitle>{{ plugin.title }}</DialogTitle>
        <DialogDescription class="space-y-2">
          <span class="block">{{ plugin.description }}</span>
          <a
            v-if="plugin.documentationUrl"
            :href="plugin.documentationUrl"
            class="text-primary underline underline-offset-4"
            rel="noreferrer"
            target="_blank"
          >
            {{ plugin.documentationLabel ?? plugin.documentationUrl }}
          </a>
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-2">
        <div class="space-y-2">
          <Label for="import-source-directory">
            {{ t('import.sourceDirectoryLabel') }}
          </Label>
          <div class="flex items-center gap-3">
            <Input
              id="import-source-directory"
              :disabled="isImporting"
              :model-value="selectedDirectory"
              :placeholder="t('import.sourceDirectoryPlaceholder')"
              class="cursor-pointer"
              readonly
              @click="void chooseDirectory()"
            />
            <Button
              type="button"
              variant="outline"
              :disabled="isImporting"
              @click="void chooseDirectory()"
            >
              {{ t('import.selectFolder') }}
            </Button>
          </div>
        </div>

        <p
          v-if="importError"
          class="text-sm text-destructive"
          role="alert"
        >
          {{ importError }}
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          :disabled="isImporting"
          @click="open = false"
        >
          {{ t('import.cancel') }}
        </Button>
        <Button
          :disabled="!canImport"
          @click="void handleImport()"
        >
          {{ t('import.importAction') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
