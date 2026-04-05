<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  useEditorLifecycle,
  type EditorjsInstance,
} from '~/composables/useEditorLifecycle'
import { useEditorSync } from '~/composables/useEditorSync'
import { useNoteStorage } from '~/composables/useNoteStorage'
import { useEditorTitleRepair } from '~/composables/useEditorTitleRepair'
import { useTranslations } from '~/composables/useTranslations'
import { handleHashtagCompletionKeyup } from '~/lib/editorjsHashtagHighlight'
import {
  patchExecCommandForInlineHighlight,
  selectionIsInsideHighlight,
  toggleInlineTagInsideHighlight,
} from '~/lib/editorjsHighlightExecPatch'
import InlineHighlightTool from '~/lib/inlineHighlightTool'
import InlineHashtagTool from '~/lib/inlineHashtagTool'
import { t as translate } from '~/composables/useTranslations'

const hashtagCompletionPattern = /(^|\s)#[^\s#]+\s$/u

const props = withDefaults(
  defineProps<{
    autosaveDelay?: number
    content?: string
    scrollResetKey?: string | null
    title?: string
    wide?: boolean
  }>(),
  {
    autosaveDelay: 2000,
    content: '',
    scrollResetKey: null,
    title: '',
    wide: false,
  },
)

const emit = defineEmits<{
  'content-change': [value: string]
  'title-change': [value: string]
}>()

const holder = ref<HTMLDivElement | null>(null)
const surface = ref<HTMLDivElement | null>(null)
const { t } = useTranslations()
const { platformApi } = useNoteStorage()
const editor = ref<EditorjsInstance | null>(null)

const {
  isApplyingExternalContent,
  lastRenderedContent,
  lastRenderedTitle,
  renderMarkdownContent,
  flushContentSync,
  scheduleContentSync,
  clearPendingContentSync,
  resetPendingExternalRender,
} = useEditorSync({
  editor,
  platformApi,
  autosaveDelay: () => props.autosaveDelay,
  content: () => props.content,
  title: () => props.title,
  emitContentChange: (value) => emit('content-change', value),
})

const { commitTitleChange, handleEditorChange } = useEditorTitleRepair({
  editor,
  isApplyingExternalContent,
  title: () => props.title,
  flushContentSync,
  scheduleContentSync,
  emitTitleChange: (value) => emit('title-change', value),
})

const { editorError, isEditorLoading, focusTitle } = useEditorLifecycle({
  editor,
  holder,
  platformApi,
  content: () => props.content,
  title: () => props.title,
  translate,
  isApplyingExternalContent,
  lastRenderedContent,
  lastRenderedTitle,
  scheduleContentSync,
  clearPendingContentSync,
  resetPendingExternalRender,
  handleEditorChange,
})

function handleHolderKeydown(event: KeyboardEvent): void {
  const modKey = event.metaKey || event.ctrlKey

  if (!modKey) {
    return
  }

  const lowerKey = event.key.toLowerCase()

  if (lowerKey !== 'b' && lowerKey !== 'i') {
    return
  }

  if (!selectionIsInsideHighlight(InlineHighlightTool.CSS)) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  toggleInlineTagInsideHighlight(
    InlineHighlightTool.CSS,
    lowerKey === 'b' ? 'B' : 'I',
  )
  scheduleContentSync()
}

function handleHolderKeyup(event: KeyboardEvent): void {
  handleHashtagCompletionKeyup({
    event,
    holder: holder.value,
    hashtagCssClass: InlineHashtagTool.CSS,
    completionPattern: hashtagCompletionPattern,
  })
}

function handleHolderFocusout(event: FocusEvent): void {
  if (!(event.target instanceof HTMLElement)) {
    return
  }

  if (!event.target.closest('[data-note-title]')) {
    return
  }

  void commitTitleChange()
}

onMounted(async () => {
  if (!holder.value) {
    return
  }

  await editor.value?.isReady

  if (!editor.value) {
    return
  }

  patchExecCommandForInlineHighlight({
    highlightCssClass: InlineHighlightTool.CSS,
    onChange: scheduleContentSync,
  })
  holder.value?.addEventListener('focusout', handleHolderFocusout)
  holder.value?.addEventListener('keydown', handleHolderKeydown, true)
  holder.value?.addEventListener('keyup', handleHolderKeyup)
})

watch(
  () => props.scrollResetKey,
  async () => {
    await nextTick()
    const el = surface.value

    if (el) {
      el.scrollTop = 0
    }
  },
)

watch(
  () => [props.content, props.title] as const,
  ([nextContent, nextTitle]) => {
    clearPendingContentSync()

    if (
      !editor.value ||
      (nextContent === lastRenderedContent.value &&
        nextTitle === lastRenderedTitle.value)
    ) {
      return
    }

    void renderMarkdownContent(nextContent, nextTitle)
  },
)

defineExpose({
  focusTitle,
  flushContentSync,
})

onBeforeUnmount(() => {
  holder.value?.removeEventListener('focusout', handleHolderFocusout)
  holder.value?.removeEventListener('keydown', handleHolderKeydown, true)
  holder.value?.removeEventListener('keyup', handleHolderKeyup)
})
</script>

<template>
  <div
    data-testid="note-editor"
    :class="['note-editor-shell', props.wide && 'note-editor-wide']"
  >
    <div
      v-if="editorError"
      data-testid="note-editor-error"
      class="notes-list-state notes-list-state-error"
    >
      {{ editorError }}
    </div>

    <div
      v-else
      ref="surface"
      class="note-editor-surface relative min-h-0 min-w-0 flex-1"
    >
      <div
        v-if="isEditorLoading"
        data-testid="note-editor-loading"
        class="notes-list-state notes-list-state-muted absolute inset-0 z-10 bg-card/80 backdrop-blur-sm"
      >
        {{ t('noteEditor.loading') }}
      </div>

      <div
        ref="holder"
        data-testid="note-editor-holder"
        class="min-h-full w-full"
      />
    </div>
  </div>
</template>
