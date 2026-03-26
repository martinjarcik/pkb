<script setup lang="ts">
import type { EditorjsBlock } from '~/lib/editorjsMarkdown'
import {
  editorjsBlocksToMarkdown,
  markdownToEditorjsBlocks,
} from '~/lib/editorjsMarkdown'
import { editorMessages } from '~/lib/editorjsMessages'
import {
  blocksMatch,
  ensureNoteTitleBlock,
  extractNoteTitleText,
  renderNoteTitleBlocks,
} from '~/lib/editorjsTitleBlock'
import NoteTitleTool from '~/lib/noteTitleTool'
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

const componentInstance = getCurrentInstance()

function translate(key: string): string {
  const translator = componentInstance?.proxy?.$t

  if (typeof translator === 'function') {
    return String(translator(key))
  }

  return key
}

const holder = ref<HTMLDivElement | null>(null)
const editorError = ref<string | null>(null)
const isEditorLoading = ref(true)

let editor: EditorjsInstance | null = null
let isApplyingExternalContent = false
let isRepairingTitleBlock = false
let lastRenderedContent = ''
let lastRenderedTitle = ''
let contentSyncTimeout: ReturnType<typeof setTimeout> | null = null
let titleBlurListener: (() => void) | null = null

function getDefaultExport(module: unknown): unknown {
  if (typeof module === 'object' && module !== null && 'default' in module) {
    return (module as { default?: unknown }).default ?? module
  }

  return module
}

async function renderMarkdownContent(markdown: string): Promise<void> {
  if (!editor) {
    return
  }

  await editor.isReady
  isApplyingExternalContent = true

  try {
    const blocks = renderNoteTitleBlocks(
      markdownToEditorjsBlocks(markdown),
      props.title,
    )

    await editor.blocks.render({ blocks })
    lastRenderedContent = markdown
    lastRenderedTitle = props.title
  } finally {
    isApplyingExternalContent = false
  }
}

async function emitContentChange(): Promise<void> {
  if (!editor || isApplyingExternalContent) {
    return
  }

  await editor.isReady
  const output = await editor.save()
  const markdown = editorjsBlocksToMarkdown(output.blocks)

  lastRenderedContent = markdown
  emit('content-change', markdown)
}

async function flushContentSync(): Promise<void> {
  if (!contentSyncTimeout) {
    return
  }

  clearTimeout(contentSyncTimeout)
  contentSyncTimeout = null
  await emitContentChange()
}

function scheduleContentSync(): void {
  if (contentSyncTimeout) {
    clearTimeout(contentSyncTimeout)
  }

  contentSyncTimeout = setTimeout(() => {
    contentSyncTimeout = null
    void emitContentChange()
  }, props.autosaveDelay)
}

async function commitTitleChange(): Promise<void> {
  if (!editor || isApplyingExternalContent) {
    return
  }

  await editor.isReady
  const output = await editor.save()
  const titleText = extractNoteTitleText(output.blocks)

  if (titleText.length === 0 || titleText === props.title) {
    return
  }

  await flushContentSync()
  emit('title-change', titleText)
}

function findNoteTitleIndex(): number {
  if (!editor) {
    return -1
  }

  const blocksCount = editor.blocks.getBlocksCount()

  for (let index = 0; index < blocksCount; index++) {
    if (editor.blocks.getBlockByIndex(index)?.name === 'noteTitle') {
      return index
    }
  }

  return -1
}

function repairMovedNoteTitleBlock(): boolean {
  if (!editor) {
    return false
  }

  if (editor.blocks.getBlockByIndex(0)?.name === 'noteTitle') {
    return false
  }

  const noteTitleIndex = findNoteTitleIndex()

  if (noteTitleIndex <= 0) {
    return false
  }

  isRepairingTitleBlock = true

  try {
    editor.blocks.move(0, noteTitleIndex)
  } finally {
    window.requestAnimationFrame(() => {
      isRepairingTitleBlock = false
    })
  }

  return true
}

async function handleEditorChange(): Promise<void> {
  if (!editor || isApplyingExternalContent || isRepairingTitleBlock) {
    return
  }

  await editor.isReady

  if (repairMovedNoteTitleBlock()) {
    return
  }

  const output = await editor.save()
  const normalizedBlocks = ensureNoteTitleBlock(output.blocks, props.title)

  if (!blocksMatch(output.blocks, normalizedBlocks)) {
    isRepairingTitleBlock = true

    try {
      await editor.blocks.render({ blocks: normalizedBlocks })
    } finally {
      isRepairingTitleBlock = false
    }

    return
  }

  scheduleContentSync()
}

function attachTitleBlurListener(): void {
  detachTitleBlurListener()

  const titleElement =
    holder.value?.querySelector<HTMLElement>('[data-note-title]')

  if (!titleElement) {
    return
  }

  const listener = () => {
    void commitTitleChange()
  }

  titleElement.addEventListener('blur', listener)
  titleBlurListener = () => titleElement.removeEventListener('blur', listener)
}

function detachTitleBlurListener(): void {
  titleBlurListener?.()
  titleBlurListener = null
}

async function focusTitle(): Promise<void> {
  if (!editor) {
    return
  }

  await nextTick()
  await editor.isReady
  await nextTick()

  const titleElement =
    holder.value?.querySelector<HTMLElement>('[data-note-title]')

  if (!titleElement) {
    editor.caret.setToBlock(0, 'end', 0)
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

  try {
    const [
      editorModule,
      headerModule,
      listModule,
      codeModule,
      delimiterModule,
      inlineCodeModule,
      tableModule,
    ] = await Promise.all([
      import('@editorjs/editorjs'),
      import('@editorjs/header'),
      import('@editorjs/list'),
      import('@editorjs/code'),
      import('@editorjs/delimiter'),
      import('@editorjs/inline-code'),
      import('@editorjs/table'),
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
    const blocks = renderNoteTitleBlocks(
      markdownToEditorjsBlocks(props.content),
      props.title,
    )

    editor = new Editorjs({
      holder: holder.value,
      autofocus: false,
      i18n: {
        messages: editorMessages,
      },
      data: {
        blocks,
      },
      onChange: () => {
        void handleEditorChange()
      },
      tools: {
        noteTitle: {
          class: NoteTitleTool,
          inlineToolbar: false,
          config: {
            ariaLabel: translate('noteTitle.ariaLabel'),
            placeholder: translate('noteTitle.placeholder'),
          },
        },
        paragraph: {
          config: {
            preserveBlank: true,
          },
        },
        header: {
          class: Header,
          inlineToolbar: true,
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
          inlineToolbar: true,
        },
        code: {
          class: Code,
        },
        delimiter: {
          class: Delimiter,
        },
        inlineCode: {
          class: InlineCode,
        },
        simpleQuote: {
          class: SimpleQuoteTool,
          inlineToolbar: true,
        },
        table: {
          class: Table,
          inlineToolbar: true,
        },
      },
    })

    await editor.isReady
    attachTitleBlurListener()

    lastRenderedContent = props.content
    lastRenderedTitle = props.title
  } catch (error) {
    editorError.value =
      error instanceof Error
        ? error.message
        : translate('noteEditor.errorFallback')
  } finally {
    isEditorLoading.value = false
  }
})

watch(
  () => [props.content, props.title] as const,
  ([nextContent, nextTitle]) => {
    if (contentSyncTimeout) {
      clearTimeout(contentSyncTimeout)
      contentSyncTimeout = null
    }

    if (
      !editor ||
      (nextContent === lastRenderedContent && nextTitle === lastRenderedTitle)
    ) {
      return
    }

    void renderMarkdownContent(nextContent)
  },
)

defineExpose({
  focusTitle,
  flushContentSync,
})

onBeforeUnmount(() => {
  if (contentSyncTimeout) {
    clearTimeout(contentSyncTimeout)
    contentSyncTimeout = null
  }

  detachTitleBlurListener()
  editor?.destroy()
  editor = null
})
</script>

<template>
  <div data-testid="note-editor" class="note-editor-shell">
    <ClientOnly>
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

      <template #fallback>
        <div
          data-testid="note-editor-loading"
          class="notes-list-state notes-list-state-muted"
        >
          {{ $t('noteEditor.loading') }}
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
