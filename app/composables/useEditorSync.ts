import { nextTick, ref, type Ref } from 'vue'
import { editorjsBlocksToMarkdown } from '~/lib/blocksToMarkdown'
import {
  normalizeSavedEditorjsBlocks,
  prepareEditorjsBlocksForEditor,
} from '~/lib/editorjsBlockTunes'
import { renderNoteTitleBlocks } from '~/lib/editorjsTitleBlock'
import { markdownToEditorjsBlocks } from '~/lib/markdownToBlocks'
import type { EditorjsBlock } from '~/lib/editorjsMarkdownTypes'
import {
  createEditorDebugTraceId,
  logEditorDebug,
  summarizeBlocksForDebug,
  summarizeMarkdownForDebug,
} from '~/lib/editorDebugTrace'
import type { PlatformApi } from '~/storage/platformApi'
import type { ComputedRef } from 'vue'

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
  platformApi: ComputedRef<PlatformApi>
  autosaveDelay: () => number
  content: () => string
  noteId: () => string | null
  title: () => string
  emitContentChange: (value: string) => void
}

export function useEditorSync({
  editor,
  platformApi,
  autosaveDelay,
  content,
  noteId,
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
    const traceId = createEditorDebugTraceId('render')

    if (!editor.value) {
      logEditorDebug('editor.render.skipped.missingEditor', {
        noteId: noteId(),
        traceId,
      })
      return
    }

    if (isApplyingExternalContent.value) {
      pendingExternalRender.value = { content: markdown, title: nextTitle }
      logEditorDebug('editor.render.queuedWhileBusy', {
        markdown: summarizeMarkdownForDebug(markdown),
        noteId: noteId(),
        title: nextTitle,
        traceId,
      })
      return
    }

    await editor.value.isReady
    isApplyingExternalContent.value = true

    try {
      await platformApi.value?.ensureReady()
      const blocks = renderNoteTitleBlocks(
        markdownToEditorjsBlocks(markdown, platformApi.value?.assetUrl),
        nextTitle,
      )

      logEditorDebug('editor.render.blocksPrepared', {
        blocks: summarizeBlocksForDebug(blocks),
        markdown: summarizeMarkdownForDebug(markdown),
        noteId: noteId(),
        title: nextTitle,
        traceId,
      })

      await editor.value.blocks.render({
        blocks: prepareEditorjsBlocksForEditor(blocks),
      })
      lastRenderedContent.value = markdown
      lastRenderedTitle.value = nextTitle
      logEditorDebug('editor.render.applied', {
        blockCount: blocks.length,
        noteId: noteId(),
        title: nextTitle,
        traceId,
      })
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
    const traceId = createEditorDebugTraceId('emit')

    if (!editor.value || isApplyingExternalContent.value) {
      logEditorDebug('editor.emit.skipped.busyOrMissingEditor', {
        isApplyingExternalContent: isApplyingExternalContent.value,
        noteId: noteId(),
        traceId,
      })
      return
    }

    await editor.value.isReady
    const output = await editor.value.save()
    logEditorDebug('editor.emit.savedRawBlocks', {
      blocks: summarizeBlocksForDebug(output.blocks),
      noteId: noteId(),
      title: title(),
      traceId,
    })
    const blocks = normalizeSavedEditorjsBlocks(output.blocks)
    logEditorDebug('editor.emit.normalizedBlocks', {
      blocks: summarizeBlocksForDebug(blocks),
      noteId: noteId(),
      title: title(),
      traceId,
    })
    const markdown = editorjsBlocksToMarkdown(
      blocks,
      platformApi.value?.markdownUrlFromAssetUrl,
    )
    logEditorDebug('editor.emit.markdownProduced', {
      markdown: summarizeMarkdownForDebug(markdown),
      noteId: noteId(),
      title: title(),
      traceId,
    })

    lastRenderedContent.value = markdown

    if (markdown === content()) {
      logEditorDebug('editor.emit.skipped.unchanged', {
        noteId: noteId(),
        traceId,
      })
      return
    }

    emitContentChange(markdown)
    logEditorDebug('editor.emit.dispatched', {
      noteId: noteId(),
      traceId,
    })
  }

  async function flushContentSync(): Promise<void> {
    const traceId = createEditorDebugTraceId('flush')

    logEditorDebug('editor.flush.requested', {
      hasPendingTimeout: Boolean(contentSyncTimeout),
      noteId: noteId(),
      traceId,
    })

    if (!contentSyncTimeout) {
      logEditorDebug('editor.flush.skipped.noPendingTimeout', {
        noteId: noteId(),
        traceId,
      })
      return
    }

    clearTimeout(contentSyncTimeout)
    contentSyncTimeout = null
    await emitContentChangeFromEditor()
    logEditorDebug('editor.flush.completed', {
      noteId: noteId(),
      traceId,
    })
  }

  function scheduleContentSync(): void {
    clearPendingContentSync()
    const delay = autosaveDelay()

    contentSyncTimeout = setTimeout(() => {
      contentSyncTimeout = null
      void emitContentChangeFromEditor()
    }, delay)
    logEditorDebug('editor.sync.scheduled', {
      delay,
      noteId: noteId(),
    })
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
