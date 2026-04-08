import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import type { ComputedRef } from 'vue'
import { prepareEditorjsBlocksForEditor } from '~/lib/editorjsBlockTunes'
import { initEditorjsDragDrop } from '~/lib/editorjsDragDrop'
import { ImageTool } from '~/lib/editorjsImageTool'
import {
  blockTuneTools,
  createEditorToolsConfig,
  editorI18n,
  inlineToolbarTools,
} from '~/lib/editorjsToolsConfig'
import { markdownToEditorjsBlocks } from '~/lib/markdownToBlocks'
import type { EditorjsBlock } from '~/lib/editorjsMarkdownTypes'
import { renderNoteTitleBlocks } from '~/lib/editorjsTitleBlock'
import { restoreExecCommand } from '~/lib/editorjsHighlightExecPatch'
import type { PlatformApi } from '~/storage/platformApi'

export type EditorjsInstance = {
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
]

const ASSET_UPLOAD_SYNC_DELAY_MS = 100

type UseEditorLifecycleArgs = {
  editor: Ref<EditorjsInstance | null>
  holder: Ref<HTMLDivElement | null>
  platformApi: ComputedRef<PlatformApi>
  content: () => string
  title: () => string
  translate: (key: string) => string
  isApplyingExternalContent: Ref<boolean>
  lastRenderedContent: Ref<string>
  lastRenderedTitle: Ref<string>
  scheduleContentSync: () => void
  clearPendingContentSync: () => void
  resetPendingExternalRender: () => void
  handleEditorChange: () => Promise<void>
}

let editorModulesPromise: Promise<LoadedEditorModules> | null = null

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
  ]) as Promise<LoadedEditorModules>

  return editorModulesPromise
}

function buildRenderedBlocks(
  markdown: string,
  noteTitle: string,
  assetUrl: (relativePath: string) => string,
): EditorjsBlock[] {
  return renderNoteTitleBlocks(
    markdownToEditorjsBlocks(markdown, assetUrl),
    noteTitle,
  )
}

/** Owns Editor.js startup, teardown, and drag/drop lifecycle for `NoteEditor.vue`. */
export function useEditorLifecycle({
  editor,
  holder,
  platformApi,
  content,
  title,
  translate,
  isApplyingExternalContent,
  lastRenderedContent,
  lastRenderedTitle,
  scheduleContentSync,
  clearPendingContentSync,
  resetPendingExternalRender,
  handleEditorChange,
}: UseEditorLifecycleArgs) {
  const editorError = ref<string | null>(null)
  const isEditorLoading = ref(true)
  let dragDropHandle: ReturnType<typeof initEditorjsDragDrop> | null = null

  function syncRenderedState(nextContent: string, nextTitle: string): void {
    lastRenderedContent.value = nextContent
    lastRenderedTitle.value = nextTitle
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
      const initialContent = content()
      const initialTitle = title()
      await platformApi.value.ensureReady()
      const [
        editorModule,
        headerModule,
        listModule,
        codeModule,
        delimiterModule,
        inlineCodeModule,
        tableModule,
      ] = await loadEditorModules()

      const Editorjs = getDefaultExport(editorModule) as EditorjsConstructor
      const Header = getDefaultExport(headerModule)
      const List = getDefaultExport(listModule)
      const Code = getDefaultExport(codeModule)
      const Delimiter = getDefaultExport(delimiterModule)
      const InlineCode = getDefaultExport(inlineCodeModule)
      const Table = getDefaultExport(tableModule)
      const blocks = buildRenderedBlocks(
        initialContent,
        initialTitle,
        platformApi.value.assetUrl,
      )

      editor.value = new Editorjs({
        holder: holder.value,
        minHeight: 50,
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
          ImageTool,
          translate,
          async uploadByFile(file: File) {
            const result = await platformApi.value.uploadAsset(file)
            setTimeout(() => scheduleContentSync(), ASSET_UPLOAD_SYNC_DELAY_MS)
            return result
          },
        }),
      })

      await editor.value.isReady

      dragDropHandle = initEditorjsDragDrop(holder.value, {
        getBlocksCount: () => editor.value!.blocks.getBlocksCount(),
        move: (to, from) => editor.value!.blocks.move(to, from),
      })

      await nextTick()

      if (content() !== initialContent || title() !== initialTitle) {
        await platformApi.value.ensureReady()
        const latestContent = content()
        const latestTitle = title()
        const latestBlocks = buildRenderedBlocks(
          latestContent,
          latestTitle,
          platformApi.value.assetUrl,
        )

        await editor.value.blocks.render({
          blocks: prepareEditorjsBlocksForEditor(latestBlocks),
        })

        syncRenderedState(latestContent, latestTitle)
      } else {
        syncRenderedState(initialContent, initialTitle)
      }

      isApplyingExternalContent.value = false
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

  onBeforeUnmount(() => {
    clearPendingContentSync()
    resetPendingExternalRender()
    restoreExecCommand()
    dragDropHandle?.destroy()
    dragDropHandle = null
    isApplyingExternalContent.value = true
    editor.value?.destroy()
    editor.value = null
  })

  return {
    editor,
    editorError,
    isEditorLoading,
    focusTitle,
  }
}
