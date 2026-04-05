<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useFolderMeta } from '~/composables/useFolderMeta'
import { useNotes } from '~/composables/useNotes'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'
import { folderDisplayName } from '~/notes/folderTree'

const { allFolderPaths, foldersExpanded, createFolder, renameFolder } =
  useSidebarNavigation()
const { loadMeta, renameFolderMeta, setFolderIcon, folderIcon } =
  useFolderMeta()
const { loadNotes } = useNotes()

const showFolderDialog = ref(false)
const folderDialogMode = ref<'create' | 'edit'>('create')
const folderNameInput = ref('')
const folderIconEmoji = ref('')
const editTargetFolderPath = ref('')
const createParentPath = ref('')
const createError = ref<string | null>(null)
const isFolderDialogBusy = ref(false)

onMounted(() => {
  void loadMeta()
})

function openCreateFolderDialog(): void {
  folderDialogMode.value = 'create'
  editTargetFolderPath.value = ''
  createParentPath.value = ''
  folderNameInput.value = ''
  folderIconEmoji.value = ''
  createError.value = null
  showFolderDialog.value = true
}

function openCreateSubfolderDialog(parentPath: string): void {
  folderDialogMode.value = 'create'
  editTargetFolderPath.value = ''
  createParentPath.value = parentPath
  folderNameInput.value = ''
  folderIconEmoji.value = ''
  createError.value = null
  showFolderDialog.value = true
}

function openEditFolderDialog(folderPath: string): void {
  folderDialogMode.value = 'edit'
  editTargetFolderPath.value = folderPath
  folderNameInput.value = folderDisplayName(folderPath)
  folderIconEmoji.value = folderIcon(folderPath) ?? ''
  createError.value = null
  showFolderDialog.value = true
}

function closeFolderDialog(): void {
  showFolderDialog.value = false
}

async function handleFolderDialogConfirm(): Promise<void> {
  createError.value = null
  isFolderDialogBusy.value = true

  try {
    if (folderDialogMode.value === 'create') {
      const result = await createFolder(
        folderNameInput.value,
        createParentPath.value,
      )

      if (!result.ok) {
        createError.value = result.error
        return
      }

      await setFolderIcon(result.folderPath, folderIconEmoji.value || undefined)
      closeFolderDialog()

      return
    }

    const oldPath = editTargetFolderPath.value
    const oldDisplayName = folderDisplayName(oldPath)
    const newName = folderNameInput.value
    const nameChanged = newName !== oldDisplayName

    if (nameChanged) {
      const result = await renameFolder(oldPath, newName)

      if (!result.ok) {
        createError.value = result.error
        return
      }

      await renameFolderMeta(oldPath, result.folderPath)
      await setFolderIcon(result.folderPath, folderIconEmoji.value || undefined)

      await loadNotes()
    } else {
      await setFolderIcon(oldPath, folderIconEmoji.value || undefined)
    }

    closeFolderDialog()
  } finally {
    isFolderDialogBusy.value = false
  }
}

function handleInputKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !isFolderDialogBusy.value) {
    void handleFolderDialogConfirm()
  }
}
</script>

<template>
  <section
    data-testid="sidebar-folders"
    class="sidebar-folders-shell flex flex-col"
  >
    <SidebarFoldersControls @open-create="openCreateFolderDialog" />
    <SidebarFoldersActions
      v-if="foldersExpanded && allFolderPaths.length > 0"
      :folder-icon="folderIcon"
      @edit-folder="openEditFolderDialog"
      @create-subfolder="openCreateSubfolderDialog"
    />

    <FolderDialog
      v-model:open="showFolderDialog"
      v-model:folder-name="folderNameInput"
      v-model:icon-emoji="folderIconEmoji"
      :mode="folderDialogMode"
      :create-error="createError"
      :is-submitting="isFolderDialogBusy"
      @confirm="handleFolderDialogConfirm"
      @cancel="closeFolderDialog"
      @input-keydown="handleInputKeydown"
    />
  </section>
</template>
