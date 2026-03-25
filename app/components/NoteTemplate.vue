<script setup lang="ts">
type NoteEditorHandle = {
  flushContentSync(): Promise<void>
}

const { registerEditorFlush, saveSelectedNoteContent, selectedNote } =
  useNotes()
const noteEditor = ref<NoteEditorHandle | null>(null)

let pendingSave = Promise.resolve()

function handleContentChange(content: string): void {
  pendingSave = saveSelectedNoteContent(content)
}

async function flushPendingContentSync(): Promise<void> {
  await noteEditor.value?.flushContentSync()
  await pendingSave
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
    <NoteEditor
      ref="noteEditor"
      :content="selectedNote?.content ?? ''"
      @content-change="handleContentChange"
    />
  </div>
</template>
