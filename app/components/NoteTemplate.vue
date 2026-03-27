<script setup lang="ts">
import { cn } from '~/lib/utils'

type NoteEditorHandle = {
  focusTitle(): Promise<void>
  flushContentSync(): Promise<void>
}

const { nonDistractionMode } = useLayout()
const {
  clearShouldFocusTitle,
  editorAutosaveDelay,
  registerEditorFlush,
  renameSelectedNoteTitle,
  saveSelectedNoteContent,
  selectedNote,
  selectedNoteTitle,
  shouldFocusTitle,
} = useNotes()
const noteEditor = ref<NoteEditorHandle | null>(null)

let pendingContentSave = Promise.resolve()

function handleContentChange(content: string): void {
  pendingContentSave = saveSelectedNoteContent(content)
}

async function handleTitleChange(title: string): Promise<void> {
  await pendingContentSave
  await renameSelectedNoteTitle(title)
}

async function flushPendingContentSync(): Promise<void> {
  await noteEditor.value?.flushContentSync()
  await pendingContentSave
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
  await noteEditor.value?.focusTitle()
  clearShouldFocusTitle()
})
</script>

<template>
  <div
    data-testid="note-template"
    :class="
      cn(
        'note-template-shell flex min-h-0 min-w-0 flex-1 flex-col',
        nonDistractionMode && 'w-1/2 self-center',
      )
    "
  >
    <ClientOnly>
      <NoteEditor
        ref="noteEditor"
        :autosave-delay="editorAutosaveDelay"
        :content="selectedNote?.content ?? ''"
        :title="selectedNoteTitle"
        @content-change="handleContentChange"
        @title-change="handleTitleChange"
      />
      <template #fallback>
        <div
          data-testid="note-editor-loading"
          class="notes-list-state notes-list-state-muted min-h-0 min-w-0 flex-1"
        >
          {{ $t('noteEditor.loading') }}
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
