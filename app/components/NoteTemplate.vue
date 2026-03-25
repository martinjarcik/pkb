<script setup lang="ts">
type NoteEditorHandle = {
  flushContentSync(): Promise<void>
}

const {
  editorAutosaveDelay,
  isRenamingNoteTitle,
  renameSelectedNoteTitle,
  registerEditorFlush,
  saveSelectedNoteContent,
  selectedNote,
  selectedNoteTitle,
} = useNotes()
const noteEditor = ref<NoteEditorHandle | null>(null)

let pendingSave = Promise.resolve()

function handleContentChange(content: string): void {
  pendingSave = saveSelectedNoteContent(content)
}

async function flushPendingContentSync(): Promise<void> {
  await noteEditor.value?.flushContentSync()
  await pendingSave
}

async function handleTitleCommit(title: string): Promise<void> {
  await renameSelectedNoteTitle(title)
}

onMounted(() => {
  registerEditorFlush(flushPendingContentSync)
})

onBeforeUnmount(() => {
  registerEditorFlush(null)
})
</script>

<template>
  <div
    data-testid="note-template"
    class="note-template-shell flex min-h-0 min-w-0 flex-1 flex-col"
  >
    <NoteTitle
      v-if="selectedNoteTitle"
      :is-saving="isRenamingNoteTitle"
      :title="selectedNoteTitle"
      @commit="handleTitleCommit"
    />
    <NoteEditor
      ref="noteEditor"
      :autosave-delay="editorAutosaveDelay"
      :content="selectedNote?.content ?? ''"
      @content-change="handleContentChange"
    />
  </div>
</template>
