<script setup lang="ts">
type NoteEditorHandle = {
  flushContentSync(): Promise<void>
}

type NoteTitleHandle = {
  focus(): void
}

const {
  clearShouldFocusTitle,
  editorAutosaveDelay,
  isRenamingNoteTitle,
  renameSelectedNoteTitle,
  registerEditorFlush,
  saveSelectedNoteContent,
  selectedNote,
  selectedNoteTitle,
  shouldFocusTitle,
} = useNotes()
const noteEditor = ref<NoteEditorHandle | null>(null)
const noteTitle = ref<NoteTitleHandle | null>(null)

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

watch(shouldFocusTitle, async (nextShouldFocusTitle) => {
  if (!nextShouldFocusTitle) {
    return
  }

  await nextTick()
  noteTitle.value?.focus()
  clearShouldFocusTitle()
})
</script>

<template>
  <div
    data-testid="note-template"
    class="note-template-shell flex min-h-0 min-w-0 flex-1 flex-col"
  >
    <NoteTitle
      v-if="selectedNoteTitle"
      ref="noteTitle"
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
