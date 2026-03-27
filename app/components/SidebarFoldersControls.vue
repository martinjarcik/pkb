<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, Plus } from 'lucide-vue-next'

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
    class="sidebar-section-controls-shell group"
  >
    <span class="sidebar-section-title">{{ $t('sidebarFolders.title') }}</span>

    <div class="sidebar-section-controls-actions">
      <button
        type="button"
        :aria-label="$t('sidebarFolders.createFolder')"
        :title="$t('sidebarFolders.createFolder')"
        class="sidebar-section-control-button"
        data-testid="sidebar-folders-create"
        @click="openCreateDialog"
      >
        <Plus :size="14" aria-hidden="true" />
      </button>
      <button
        type="button"
        :aria-label="$t('sidebarFolders.toggleFolders')"
        :title="$t('sidebarFolders.toggleFolders')"
        class="sidebar-section-control-button"
        data-testid="sidebar-folders-toggle"
        @click="toggleFoldersExpanded"
      >
        <ChevronDown
          :size="14"
          aria-hidden="true"
          class="transition-transform"
          :class="{ '-rotate-90': !foldersExpanded }"
        />
      </button>
    </div>

    <CreateFolderDialog
      v-model:open="showCreateDialog"
      v-model:folder-name="folderNameInput"
      :create-error="createError"
      :is-creating="isCreating"
      @cancel="closeCreateDialog"
      @create="handleCreate"
      @input-keydown="handleInputKeydown"
    />
  </div>
</template>
