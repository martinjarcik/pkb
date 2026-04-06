<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import NoteEditor from '~/components/NoteEditor.vue'
import { useNotes } from '~/composables/useNotes'

type NoteEditorHandle = {
  focusTitle(): Promise<void>
  flushEditorState(): Promise<void>
  flushContentSync(): Promise<void>
}

const {
  clearShouldFocusTitle,
  editorAutosaveDelay,
  registerEditorFlush,
  renameSelectedNoteTitle,
  saveSelectedNoteContent,
  selectedNote,
  selectedNoteId,
  selectedNoteTitle,
  shouldFocusTitle,
} = useNotes()
const noteEditor = ref<NoteEditorHandle | null>(null)
const isWide = computed(() => selectedNote.value?.wide === true)

let pendingContentSave = Promise.resolve()

function handleContentChange(content: string): void {
  pendingContentSave = saveSelectedNoteContent(content)
}

async function handleTitleChange(title: string): Promise<void> {
  await pendingContentSave
  await renameSelectedNoteTitle(title)
}

async function flushPendingEditorSync(): Promise<void> {
  await noteEditor.value?.flushEditorState()
  await pendingContentSave
}

onMounted(() => {
  registerEditorFlush(flushPendingEditorSync)
})

onBeforeUnmount(() => {
  registerEditorFlush(null)
})

watch(shouldFocusTitle, async (nextShouldFocusTitle) => {
  if (!nextShouldFocusTitle) {
    return
  }

  await nextTick()
  await noteEditor.value?.focusTitle()
  clearShouldFocusTitle()
})
</script>

<template>
  <div
    data-testid="note-template"
    class="note-template-shell flex min-h-0 min-w-0 flex-1 flex-col"
  >
    <NoteEditor
      ref="noteEditor"
      :autosave-delay="editorAutosaveDelay"
      :content="selectedNote?.content ?? ''"
      :scroll-reset-key="selectedNoteId"
      :title="selectedNoteTitle"
      :wide="isWide"
      @content-change="handleContentChange"
      @title-change="handleTitleChange"
    />
  </div>
</template>
