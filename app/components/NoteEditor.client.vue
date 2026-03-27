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
import InlineHashtagTool from '~/lib/inlineHashtagTool'
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

const inlineToolbarTools = ['link', 'bold', 'italic', 'inlineCode']
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

let editor: EditorjsInstance | null = null
let isApplyingExternalContent = false
let isRepairingTitleBlock = false
let lastRenderedContent = ''
let lastRenderedTitle = ''
let contentSyncTimeout: ReturnType<typeof setTimeout> | null = null

function getDefaultExport(module: unknown): unknown {
  if (typeof module === 'object' && module !== null && 'default' in module) {
    return (module as { default?: unknown }).default ?? module
  }

  return module
}

function caretTextOffsetWithin(container: HTMLElement): number | null {
  const selection = window.getSelection()

  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    return null
  }

  const range = selection.getRangeAt(0).cloneRange()

  if (!container.contains(range.endContainer)) {
    return null
  }

  range.setStart(container, 0)

  return range.toString().length
}

function setCaretTextOffset(container: HTMLElement, offset: number): void {
  const selection = window.getSelection()

  if (!selection) {
    return
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let traversed = 0
  let currentNode = walker.nextNode()

  while (currentNode) {
    const textNode = currentNode as Text
    const nextTraversed = traversed + textNode.data.length

    if (offset <= nextTraversed) {
      const range = document.createRange()
      const nodeOffset = Math.max(0, offset - traversed)

      range.setStart(textNode, nodeOffset)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      return
    }

    traversed = nextTraversed
    currentNode = walker.nextNode()
  }

  const range = document.createRange()

  range.selectNodeContents(container)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

function createHashtagFragment(text: string): DocumentFragment | null {
  const matches = [...text.matchAll(/(^|\s)(#[^\s#]+)/gu)]

  if (matches.length === 0) {
    return null
  }

  const fragment = document.createDocumentFragment()
  let lastIndex = 0

  for (const match of matches) {
    const leading = match[1] ?? ''
    const tag = match[2] ?? ''
    const matchIndex = match.index ?? 0
    const tagStart = matchIndex + leading.length

    fragment.append(text.slice(lastIndex, tagStart))

    const hashtag = document.createElement('span')

    hashtag.className = InlineHashtagTool.CSS
    hashtag.textContent = tag
    fragment.append(hashtag)
    lastIndex = tagStart + tag.length
  }

  fragment.append(text.slice(lastIndex))

  return fragment
}

function highlightHashtagsInEditable(editable: HTMLElement): void {
  const caretOffset = caretTextOffsetWithin(editable)
  const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parentElement = node.parentElement

      if (
        parentElement?.closest(
          `.${InlineHashtagTool.CSS}, code, a, [data-note-title]`,
        )
      ) {
        return NodeFilter.FILTER_REJECT
      }

      return NodeFilter.FILTER_ACCEPT
    },
  })
  const textNodes: Text[] = []

  let currentNode = walker.nextNode()

  while (currentNode) {
    textNodes.push(currentNode as Text)
    currentNode = walker.nextNode()
  }

  let didReplace = false

  for (const textNode of textNodes) {
    const fragment = createHashtagFragment(textNode.data)

    if (!fragment) {
      continue
    }

    textNode.parentNode?.replaceChild(fragment, textNode)
    didReplace = true
  }

  if (didReplace && caretOffset !== null) {
    setCaretTextOffset(editable, caretOffset)
  }
}

function resolveEditableTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Node)) {
    return null
  }

  const element =
    target instanceof HTMLElement ? target : (target.parentElement ?? null)
  const editable = element?.closest<HTMLElement>('[contenteditable="true"]')

  if (
    !editable ||
    !holder.value?.contains(editable) ||
    editable.matches('[data-note-title]')
  ) {
    return null
  }

  return editable
}

function handleHolderKeyup(event: KeyboardEvent): void {
  if (event.key !== ' ' && event.code !== 'Space') {
    return
  }

  const editable = resolveEditableTarget(event.target)

  if (!editable || !hashtagCompletionPattern.test(editable.textContent ?? '')) {
    return
  }

  highlightHashtagsInEditable(editable)
}

async function renderMarkdownContent(markdown: string): Promise<void> {
  if (!editor || isApplyingExternalContent) {
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
    await nextTick()
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

function handleHolderFocusout(event: FocusEvent): void {
  if (!(event.target instanceof HTMLElement)) {
    return
  }

  if (!event.target.closest('[data-note-title]')) {
    return
  }

  void commitTitleChange()
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

function isEditorBusy(): boolean {
  return !editor || isApplyingExternalContent || isRepairingTitleBlock
}

async function handleEditorChange(): Promise<void> {
  if (isEditorBusy()) {
    return
  }

  await editor!.isReady

  if (isEditorBusy()) {
    return
  }

  if (repairMovedNoteTitleBlock()) {
    return
  }

  const output = await editor!.save()

  if (isEditorBusy()) {
    return
  }

  const normalizedBlocks = ensureNoteTitleBlock(output.blocks, props.title)

  if (!blocksMatch(output.blocks, normalizedBlocks)) {
    isRepairingTitleBlock = true

    try {
      await editor!.blocks.render({ blocks: normalizedBlocks })
    } finally {
      isRepairingTitleBlock = false
    }

    return
  }

  scheduleContentSync()
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

  isApplyingExternalContent = true

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
          inlineToolbar: inlineToolbarTools,
          config: {
            preserveBlank: true,
          },
        },
        header: {
          class: Header,
          inlineToolbar: inlineToolbarTools,
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
        inlineHashtag: {
          class: InlineHashtagTool,
        },
        simpleQuote: {
          class: SimpleQuoteTool,
          inlineToolbar: inlineToolbarTools,
        },
        table: {
          class: Table,
          inlineToolbar: inlineToolbarTools,
        },
      },
    })

    await editor.isReady
    await nextTick()
    isApplyingExternalContent = false
    holder.value?.addEventListener('focusout', handleHolderFocusout)
    holder.value?.addEventListener('keyup', handleHolderKeyup)

    lastRenderedContent = props.content
    lastRenderedTitle = props.title
  } catch (error) {
    editorError.value =
      error instanceof Error
        ? error.message
        : translate('noteEditor.errorFallback')
  } finally {
    isApplyingExternalContent = false
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

  holder.value?.removeEventListener('focusout', handleHolderFocusout)
  holder.value?.removeEventListener('keyup', handleHolderKeyup)
  isApplyingExternalContent = true
  editor?.destroy()
  editor = null
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
