import { nextTick, ref, type Ref } from 'vue'
import { editorjsBlocksToMarkdown } from '~/lib/blocksToMarkdown'
import {
  normalizeSavedEditorjsBlocks,
  prepareEditorjsBlocksForEditor,
} from '~/lib/editorjsBlockBackground'
import { renderNoteTitleBlocks } from '~/lib/editorjsTitleBlock'
import { markdownToEditorjsBlocks } from '~/lib/markdownToBlocks'
import type { EditorjsBlock } from '~/lib/editorjsMarkdownTypes'

type EditorjsInstance = {
  blocks: {
    render(data: { blocks: EditorjsBlock[] }): Promise<void>
  }
  isReady: Promise<void>
  save(): Promise<{ blocks: EditorjsBlock[] }>
}

type PendingExternalRender = {
  content: string
  title: string
}

type UseEditorSyncArgs = {
  editor: Ref<EditorjsInstance | null>
  autosaveDelay: () => number
  content: () => string
  title: () => string
  emitContentChange: (value: string) => void
}

export function useEditorSync({
  editor,
  autosaveDelay,
  content,
  title,
  emitContentChange,
}: UseEditorSyncArgs) {
  const isApplyingExternalContent = ref(false)
  const lastRenderedContent = ref('')
  const lastRenderedTitle = ref('')
  const pendingExternalRender = ref<PendingExternalRender | null>(null)
  let contentSyncTimeout: ReturnType<typeof setTimeout> | null = null

  async function renderMarkdownContent(
    markdown: string,
    nextTitle: string = title(),
  ): Promise<void> {
    if (!editor.value) {
      return
    }

    if (isApplyingExternalContent.value) {
      pendingExternalRender.value = { content: markdown, title: nextTitle }
      return
    }

    await editor.value.isReady
    isApplyingExternalContent.value = true

    try {
      const blocks = renderNoteTitleBlocks(
        markdownToEditorjsBlocks(markdown),
        nextTitle,
      )

      await editor.value.blocks.render({
        blocks: prepareEditorjsBlocksForEditor(blocks),
      })
      lastRenderedContent.value = markdown
      lastRenderedTitle.value = nextTitle
    } finally {
      await nextTick()
      isApplyingExternalContent.value = false
    }

    const queuedRender = pendingExternalRender.value

    pendingExternalRender.value = null

    if (
      queuedRender &&
      (queuedRender.content !== lastRenderedContent.value ||
        queuedRender.title !== lastRenderedTitle.value)
    ) {
      await renderMarkdownContent(queuedRender.content, queuedRender.title)
      return
    }

    if (
      content() !== lastRenderedContent.value ||
      title() !== lastRenderedTitle.value
    ) {
      await renderMarkdownContent(content(), title())
    }
  }

  async function emitContentChangeFromEditor(): Promise<void> {
    if (!editor.value || isApplyingExternalContent.value) {
      return
    }

    await editor.value.isReady
    const output = await editor.value.save()
    const blocks = normalizeSavedEditorjsBlocks(output.blocks)
    const markdown = editorjsBlocksToMarkdown(blocks)

    lastRenderedContent.value = markdown
    emitContentChange(markdown)
  }

  async function flushContentSync(): Promise<void> {
    if (!contentSyncTimeout) {
      return
    }

    clearTimeout(contentSyncTimeout)
    contentSyncTimeout = null
    await emitContentChangeFromEditor()
  }

  function scheduleContentSync(): void {
    if (contentSyncTimeout) {
      clearTimeout(contentSyncTimeout)
    }

    contentSyncTimeout = setTimeout(() => {
      contentSyncTimeout = null
      void emitContentChangeFromEditor()
    }, autosaveDelay())
  }

  function clearPendingContentSync(): void {
    if (contentSyncTimeout) {
      clearTimeout(contentSyncTimeout)
      contentSyncTimeout = null
    }
  }

  function resetPendingExternalRender(): void {
    pendingExternalRender.value = null
  }

  return {
    isApplyingExternalContent,
    lastRenderedContent,
    lastRenderedTitle,
    renderMarkdownContent,
    flushContentSync,
    scheduleContentSync,
    clearPendingContentSync,
    resetPendingExternalRender,
  }
}
