<script setup lang="ts">
import type { EditorjsBlock } from '~/lib/editorjsMarkdownTypes'
import { prepareEditorjsBlocksForEditor } from '~/lib/editorjsBlockBackground'
import {
  blockTuneTools,
  createEditorToolsConfig,
  editorI18n,
  inlineToolbarTools,
} from '~/lib/editorjsToolsConfig'
import { handleHashtagCompletionKeyup } from '~/lib/editorjsHashtagHighlight'
import {
  patchExecCommandForInlineHighlight,
  restoreExecCommand,
  selectionIsInsideHighlight,
  toggleInlineTagInsideHighlight,
} from '~/lib/editorjsHighlightExecPatch'
import { renderNoteTitleBlocks } from '~/lib/editorjsTitleBlock'
import InlineHighlightTool from '~/lib/inlineHighlightTool'
import InlineHashtagTool from '~/lib/inlineHashtagTool'
import { markdownToEditorjsBlocks } from '~/lib/markdownToBlocks'
import { t as translate } from '~/composables/useTranslations'

type EditorjsInstance = {
  blocks: {
    getBlockByIndex(index: number): { name: string } | undefined
    getBlocksCount(): number
    move(toIndex: number, fromIndex?: number): void
    render(data: { blocks: EditorjsBlock[] }): Promise<void>
  }
  caret: {
    setToBlock(index: number, position?: string, offset?: number): boolean
  }
  destroy(): void
  isReady: Promise<void>
  save(): Promise<{ blocks: EditorjsBlock[] }>
}

type EditorjsConstructor = new (
  configuration: Record<string, unknown>,
) => EditorjsInstance
type LoadedEditorModules = [
  editorModule: unknown,
  headerModule: unknown,
  listModule: unknown,
  codeModule: unknown,
  delimiterModule: unknown,
  inlineCodeModule: unknown,
  tableModule: unknown,
  imageModule: unknown,
]

const hashtagCompletionPattern = /(^|\s)#[^\s#]+\s$/u
let editorModulesPromise: Promise<LoadedEditorModules> | null = null

const props = withDefaults(
  defineProps<{
    autosaveDelay?: number
    content?: string
    title?: string
  }>(),
  {
    autosaveDelay: 2000,
    content: '',
    title: '',
  },
)

const emit = defineEmits<{
  'content-change': [value: string]
  'title-change': [value: string]
}>()

const holder = ref<HTMLDivElement | null>(null)
const editorError = ref<string | null>(null)
const isEditorLoading = ref(true)
const { platformApi } = usePlatformApi()

const editor = ref<EditorjsInstance | null>(null)

function getDefaultExport(module: unknown): unknown {
  if (typeof module === 'object' && module !== null && 'default' in module) {
    return (module as { default?: unknown }).default ?? module
  }

  return module
}

function loadEditorModules(): Promise<LoadedEditorModules> {
  editorModulesPromise ??= Promise.all([
    import('@editorjs/editorjs'),
    import('@editorjs/header'),
    import('@editorjs/list'),
    import('@editorjs/code'),
    import('@editorjs/delimiter'),
    import('@editorjs/inline-code'),
    import('@editorjs/table'),
    import('@editorjs/image'),
  ]) as Promise<LoadedEditorModules>

  return editorModulesPromise
}

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

async function focusTitle(): Promise<void> {
  if (!editor.value) {
    return
  }

  await nextTick()
  await editor.value.isReady
  await nextTick()

  const titleElement =
    holder.value?.querySelector<HTMLElement>('[data-note-title]')

  if (!titleElement) {
    editor.value.caret.setToBlock(0, 'end', 0)
    return
  }

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      const selection = window.getSelection()
      const range = document.createRange()

      titleElement.focus()
      range.selectNodeContents(titleElement)
      range.collapse(false)
      selection?.removeAllRanges()
      selection?.addRange(range)
      resolve()
    })
  })
}

onMounted(async () => {
  await nextTick()

  if (!holder.value) {
    editorError.value = translate('noteEditor.errorContainerUnavailable')
    isEditorLoading.value = false

    return
  }

  isApplyingExternalContent.value = true

  try {
    const initialContent = props.content
    const initialTitle = props.title
    const [
      editorModule,
      headerModule,
      listModule,
      codeModule,
      delimiterModule,
      inlineCodeModule,
      tableModule,
      imageModule,
    ] = await loadEditorModules()

    const Editorjs = getDefaultExport(
      editorModule,
    ) as unknown as EditorjsConstructor
    const Header = getDefaultExport(headerModule)
    const List = getDefaultExport(listModule)
    const Code = getDefaultExport(codeModule)
    const Delimiter = getDefaultExport(delimiterModule)
    const InlineCode = getDefaultExport(inlineCodeModule)
    const Table = getDefaultExport(tableModule)
    const ImageTool = getDefaultExport(imageModule)
    const blocks = renderNoteTitleBlocks(
      markdownToEditorjsBlocks(initialContent, platformApi.value?.assetUrl),
      initialTitle,
    )

    editor.value = new Editorjs({
      holder: holder.value,
      autofocus: false,
      inlineToolbar: inlineToolbarTools,
      i18n: editorI18n,
      data: {
        blocks,
      },
      onChange: () => {
        void handleEditorChange()
      },
      tunes: blockTuneTools,
      tools: createEditorToolsConfig({
        Header: Header as new (...args: never[]) => unknown,
        List: List as new (...args: never[]) => unknown,
        Code: Code as new (...args: never[]) => unknown,
        Delimiter: Delimiter as new (...args: never[]) => unknown,
        InlineCode: InlineCode as new (...args: never[]) => unknown,
        Table: Table as new (...args: never[]) => unknown,
        ImageTool: ImageTool as new (...args: never[]) => unknown,
        translate,
        uploadByFile(file: File) {
          if (platformApi.value === null) {
            throw new Error('Image upload is only supported in desktop mode')
          }

          return platformApi.value.uploadAsset(file)
        },
      }),
    })

    await editor.value.isReady
    await nextTick()

    if (props.content !== initialContent || props.title !== initialTitle) {
      const latestBlocks = renderNoteTitleBlocks(
        markdownToEditorjsBlocks(props.content, platformApi.value?.assetUrl),
        props.title,
      )

      await editor.value.blocks.render({
        blocks: prepareEditorjsBlocksForEditor(latestBlocks),
      })
    }

    isApplyingExternalContent.value = false
    patchExecCommandForInlineHighlight({
      highlightCssClass: InlineHighlightTool.CSS,
      onChange: scheduleContentSync,
    })
    holder.value?.addEventListener('focusout', handleHolderFocusout)
    holder.value?.addEventListener('keydown', handleHolderKeydown, true)
    holder.value?.addEventListener('keyup', handleHolderKeyup)

    lastRenderedContent.value = props.content
    lastRenderedTitle.value = props.title
  } catch (error) {
    editorError.value =
      error instanceof Error
        ? error.message
        : translate('noteEditor.errorFallback')
  } finally {
    isApplyingExternalContent.value = false
    isEditorLoading.value = false
  }
})

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
  clearPendingContentSync()
  resetPendingExternalRender()

  holder.value?.removeEventListener('focusout', handleHolderFocusout)
  holder.value?.removeEventListener('keydown', handleHolderKeydown, true)
  holder.value?.removeEventListener('keyup', handleHolderKeyup)
  restoreExecCommand()
  isApplyingExternalContent.value = true
  editor.value?.destroy()
  editor.value = null
})
</script>

<template>
  <div data-testid="note-editor" class="note-editor-shell">
    <div
      v-if="editorError"
      data-testid="note-editor-error"
      class="notes-list-state notes-list-state-error"
    >
      {{ editorError }}
    </div>

    <div v-else class="note-editor-surface relative min-h-0 min-w-0 flex-1">
      <div
        v-if="isEditorLoading"
        data-testid="note-editor-loading"
        class="notes-list-state notes-list-state-muted absolute inset-0 z-10 bg-card/80 backdrop-blur-sm"
      >
        {{ $t('noteEditor.loading') }}
      </div>

      <div
        ref="holder"
        data-testid="note-editor-holder"
        class="min-h-full w-full"
      />
    </div>
  </div>
</template>
