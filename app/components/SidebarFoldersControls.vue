<script setup lang="ts">
import { ref } from 'vue'

const { foldersExpanded, toggleFoldersExpanded, createFolder } =
  useSidebarNavigation()

const showCreateDialog = useState('createFolderDialog', () => false)
const folderNameInput = ref('')
const createError = ref<string | null>(null)
const isCreating = ref(false)

function openCreateDialog(): void {
  folderNameInput.value = ''
  createError.value = null
  showCreateDialog.value = true
}

function closeCreateDialog(): void {
  showCreateDialog.value = false
  folderNameInput.value = ''
  createError.value = null
}

async function handleCreate(): Promise<void> {
  createError.value = null
  isCreating.value = true

  const error = await createFolder(folderNameInput.value)

  isCreating.value = false

  if (error) {
    createError.value = error
    return
  }

  closeCreateDialog()
}

function handleInputKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !isCreating.value) {
    handleCreate()
  }
}
</script>

<template>
  <div
    data-testid="sidebar-folders-controls"
    class="sidebar-folders-controls-shell group"
  >
    <span class="sidebar-folders-title">{{ $t('sidebarFolders.title') }}</span>

    <div class="sidebar-folders-controls-actions">
      <button
        type="button"
        :aria-label="$t('sidebarFolders.createFolder')"
        :title="$t('sidebarFolders.createFolder')"
        class="sidebar-folders-control-button"
        data-testid="sidebar-folders-create"
        @click="openCreateDialog"
      >
        <Icon name="lucide:plus" size="14" aria-hidden="true" />
      </button>
      <button
        type="button"
        :aria-label="$t('sidebarFolders.toggleFolders')"
        :title="$t('sidebarFolders.toggleFolders')"
        class="sidebar-folders-control-button"
        data-testid="sidebar-folders-toggle"
        @click="toggleFoldersExpanded"
      >
        <Icon
          name="lucide:chevron-down"
          size="14"
          aria-hidden="true"
          class="transition-transform"
          :class="{ '-rotate-90': !foldersExpanded }"
        />
      </button>
    </div>

    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{{ $t('sidebarFolders.createFolder') }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ $t('sidebarFolders.folderNameLabel') }}
          </DialogDescription>
        </DialogHeader>

        <div class="flex flex-col gap-3 py-2">
          <Input
            v-model="folderNameInput"
            :placeholder="$t('sidebarFolders.folderNamePlaceholder')"
            data-testid="create-folder-name-input"
            @keydown="handleInputKeydown"
          />
          <p
            v-if="createError"
            class="text-sm text-destructive"
            data-testid="create-folder-error"
          >
            {{ createError }}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            data-testid="create-folder-cancel"
            @click="closeCreateDialog"
          >
            {{ $t('sidebarFolders.cancel') }}
          </Button>
          <Button
            :disabled="isCreating"
            data-testid="create-folder-confirm"
            @click="handleCreate"
          >
            {{ $t('sidebarFolders.create') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
