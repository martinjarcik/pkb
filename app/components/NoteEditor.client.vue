<script setup lang="ts">
import type { EditorjsBlock } from '~/lib/editorjsMarkdownTypes'
import {
  BLOCK_BACKGROUND_TUNE_NAME,
  prepareEditorjsBlocksForEditor,
} from '~/lib/editorjsBlockBackground'
import EditorjsBlockBackgroundTune from '~/lib/editorjsBlockBackgroundTune'
import { editorMessages } from '~/lib/editorjsMessages'
import { handleHashtagCompletionKeyup } from '~/lib/editorjsHashtagHighlight'
import { renderNoteTitleBlocks } from '~/lib/editorjsTitleBlock'
import BigEmojiTool from '~/lib/bigEmojiTool'
import InlineHighlightTool from '~/lib/inlineHighlightTool'
import InlineHashtagTool from '~/lib/inlineHashtagTool'
import { markdownToEditorjsBlocks } from '~/lib/markdownToBlocks'
import NoteTitleTool from '~/lib/noteTitleTool'
import { t as translate } from '~/composables/useTranslations'
import SimpleQuoteTool from '~/lib/simpleQuoteTool'

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

type EditorjsTool = new (...args: never[]) => unknown

const inlineToolbarTools = [
  'link',
  'bold',
  'italic',
  'inlineCode',
  'bigEmoji',
  'inlineHighlight',
]
const blockTuneTools = [BLOCK_BACKGROUND_TUNE_NAME]
const hashtagCompletionPattern = /(^|\s)#[^\s#]+\s$/u

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

const editor = ref<EditorjsInstance | null>(null)

function getDefaultExport(module: unknown): unknown {
  if (typeof module === 'object' && module !== null && 'default' in module) {
    return (module as { default?: unknown }).default ?? module
  }

  return module
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

function findAncestorHighlightMark(node: Node | null): HTMLElement | null {
  if (!node) {
    return null
  }

  const element = node instanceof HTMLElement ? node : node.parentElement
  return (
    element?.closest<HTMLElement>(`mark.${InlineHighlightTool.CSS}`) ?? null
  )
}

function selectionIsInsideHighlight(): HTMLElement | null {
  const selection = window.getSelection()

  if (!selection || selection.rangeCount === 0) {
    return null
  }

  const range = selection.getRangeAt(0)
  const startMark = findAncestorHighlightMark(range.startContainer)
  const endMark = findAncestorHighlightMark(range.endContainer)

  if (!startMark || startMark !== endMark) {
    return null
  }

  return startMark
}

function toggleInlineTagInsideHighlight(tagName: 'B' | 'I'): void {
  const selection = window.getSelection()

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return
  }

  const range = selection.getRangeAt(0)
  const parentTag =
    range.commonAncestorContainer instanceof HTMLElement
      ? range.commonAncestorContainer.closest(tagName)
      : range.commonAncestorContainer.parentElement?.closest(tagName)

  if (parentTag && findAncestorHighlightMark(parentTag)) {
    const fragment = document.createDocumentFragment()

    while (parentTag.firstChild) {
      fragment.appendChild(parentTag.firstChild)
    }

    parentTag.parentNode?.replaceChild(fragment, parentTag)
    return
  }

  const wrapper = document.createElement(tagName)

  wrapper.appendChild(range.extractContents())
  range.insertNode(wrapper)
  selection.removeAllRanges()

  const restored = document.createRange()

  restored.selectNodeContents(wrapper)
  selection.addRange(restored)
}

function handleHolderKeydown(event: KeyboardEvent): void {
  const modKey = event.metaKey || event.ctrlKey

  if (!modKey) {
    return
  }

  const lowerKey = event.key.toLowerCase()

  if (lowerKey !== 'b' && lowerKey !== 'i') {
    return
  }

  if (!selectionIsInsideHighlight()) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  toggleInlineTagInsideHighlight(lowerKey === 'b' ? 'B' : 'I')
  scheduleContentSync()
}

let originalExecCommand: typeof document.execCommand | null = null

function patchExecCommand(): void {
  if (originalExecCommand) {
    return
  }

  originalExecCommand = document.execCommand.bind(document)
  document.execCommand = (
    command: string,
    showUI?: boolean,
    value?: string,
  ): boolean => {
    const lowerCommand = command.toLowerCase()

    if (
      (lowerCommand === 'bold' || lowerCommand === 'italic') &&
      selectionIsInsideHighlight()
    ) {
      toggleInlineTagInsideHighlight(lowerCommand === 'bold' ? 'B' : 'I')
      scheduleContentSync()
      return true
    }

    return originalExecCommand!(command, showUI, value)
  }
}

function restoreExecCommand(): void {
  if (!originalExecCommand) {
    return
  }

  document.execCommand = originalExecCommand
  originalExecCommand = null
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
    ] = await Promise.all([
      import('@editorjs/editorjs'),
      import('@editorjs/header'),
      import('@editorjs/list'),
      import('@editorjs/code'),
      import('@editorjs/delimiter'),
      import('@editorjs/inline-code'),
      import('@editorjs/table'),
      import('@editorjs/image'),
    ])

    const Editorjs = getDefaultExport(
      editorModule,
    ) as unknown as EditorjsConstructor
    const Header = getDefaultExport(headerModule) as EditorjsTool
    const List = getDefaultExport(listModule) as EditorjsTool
    const Code = getDefaultExport(codeModule) as EditorjsTool
    const Delimiter = getDefaultExport(delimiterModule) as EditorjsTool
    const InlineCode = getDefaultExport(inlineCodeModule) as EditorjsTool
    const Table = getDefaultExport(tableModule) as EditorjsTool
    const ImageTool = getDefaultExport(imageModule) as EditorjsTool
    const blocks = renderNoteTitleBlocks(
      markdownToEditorjsBlocks(initialContent),
      initialTitle,
    )

    editor.value = new Editorjs({
      holder: holder.value,
      autofocus: false,
      inlineToolbar: inlineToolbarTools,
      i18n: {
        messages: editorMessages,
      },
      data: {
        blocks,
      },
      onChange: () => {
        void handleEditorChange()
      },
      tunes: blockTuneTools,
      tools: {
        [BLOCK_BACKGROUND_TUNE_NAME]: {
          class: EditorjsBlockBackgroundTune,
        },
        noteTitle: {
          class: NoteTitleTool,
          inlineToolbar: false,
          config: {
            ariaLabel: translate('noteTitle.ariaLabel'),
            placeholder: translate('noteTitle.placeholder'),
          },
        },
        paragraph: {
          inlineToolbar: inlineToolbarTools,
          tunes: blockTuneTools,
          config: {
            preserveBlank: true,
          },
        },
        header: {
          class: Header,
          inlineToolbar: inlineToolbarTools,
          tunes: blockTuneTools,
          toolbox: [
            {
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" rtrvr-ls="0~hs"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6 7L6 12M6 17L6 12M6 12L12 12M12 7V12M12 17L12 12"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M19 17V10.2135C19 10.1287 18.9011 10.0824 18.836 10.1367L16 12.5"></path></svg>',
              title: 'Heading 1',
              data: {
                level: 1,
              },
            },
            {
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6 7L6 12M6 17L6 12M6 12L12 12M12 7V12M12 17L12 12"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16 11C16 10 19 9.5 19 12C19 13.9771 16.0684 13.9997 16.0012 16.8981C15.9999 16.9533 16.0448 17 16.1 17L19.3 17"></path></svg>',
              title: 'Heading 2',
              data: {
                level: 2,
              },
            },
            {
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6 7L6 12M6 17L6 12M6 12L12 12M12 7V12M12 17L12 12"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16 11C16 10.5 16.8323 10 17.6 10C18.3677 10 19.5 10.311 19.5 11.5C19.5 12.5315 18.7474 12.9022 18.548 12.9823C18.5378 12.9864 18.5395 13.0047 18.5503 13.0063C18.8115 13.0456 20 13.3065 20 14.8C20 16 19.5 17 17.8 17C17.8 17 16 17 16 16.3"></path></svg>',
              title: 'Heading 3',
              data: {
                level: 3,
              },
            },
          ],
          config: {
            placeholder: 'Heading',
            levels: [1, 2, 3],
            defaultLevel: 2,
          },
        },
        list: {
          class: List,
          inlineToolbar: inlineToolbarTools,
          tunes: blockTuneTools,
        },
        code: {
          class: Code,
          tunes: blockTuneTools,
        },
        delimiter: {
          class: Delimiter,
          tunes: blockTuneTools,
        },
        inlineCode: {
          class: InlineCode,
        },
        bigEmoji: {
          class: BigEmojiTool,
        },
        inlineHighlight: {
          class: InlineHighlightTool,
        },
        inlineHashtag: {
          class: InlineHashtagTool,
        },
        simpleQuote: {
          class: SimpleQuoteTool,
          inlineToolbar: inlineToolbarTools,
          tunes: blockTuneTools,
        },
        table: {
          class: Table,
          inlineToolbar: inlineToolbarTools,
          tunes: blockTuneTools,
        },
        image: {
          class: ImageTool,
          tunes: blockTuneTools,
          config: {
            uploader: {
              uploadByFile(file: File) {
                const form = new FormData()

                form.append('image', file)

                return globalThis.$fetch<{
                  success: number
                  file: { url: string }
                }>('/api/vault-assets/upload', {
                  method: 'POST',
                  body: form,
                })
              },
            },
          },
        },
      },
    })

    await editor.value.isReady
    await nextTick()

    const latestBlocks = renderNoteTitleBlocks(
      markdownToEditorjsBlocks(props.content),
      props.title,
    )

    await editor.value.blocks.render({
      blocks: prepareEditorjsBlocksForEditor(latestBlocks),
    })

    isApplyingExternalContent.value = false
    patchExecCommand()
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
