<script setup lang="ts">
import type { EditorjsBlock } from '~/composables/useEditorjsMarkdown'

type EditorjsInstance = {
  blocks: {
    render(data: { blocks: EditorjsBlock[] }): Promise<void>
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
    content?: string
  }>(),
  {
    content: '',
  },
)

const emit = defineEmits<{
  'content-change': [value: string]
}>()

const { editorjsBlocksToMarkdown, markdownToEditorjsBlocks } =
  useEditorjsMarkdown()

const holder = ref<HTMLDivElement | null>(null)
const editorError = ref<string | null>(null)
const isEditorLoading = ref(true)

let editor: EditorjsInstance | null = null
let isApplyingExternalContent = false
let lastRenderedContent = ''
let contentSyncTimeout: ReturnType<typeof setTimeout> | null = null

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
    const blocks = await markdownToEditorjsBlocks(markdown)

    await editor.blocks.render({ blocks })
    lastRenderedContent = markdown
  } finally {
    isApplyingExternalContent = false
  }
}

async function emitMarkdownContent(): Promise<void> {
  if (!editor || isApplyingExternalContent) {
    return
  }

  await editor.isReady
  const output = await editor.save()
  const markdown = await editorjsBlocksToMarkdown(output.blocks)

  lastRenderedContent = markdown
  emit('content-change', markdown)
}

function scheduleContentSync(): void {
  if (contentSyncTimeout) {
    clearTimeout(contentSyncTimeout)
  }

  contentSyncTimeout = setTimeout(() => {
    contentSyncTimeout = null
    void emitMarkdownContent()
  }, 250)
}

onMounted(async () => {
  await nextTick()

  if (!holder.value) {
    editorError.value = 'Editor container is unavailable'
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
    const blocks = await markdownToEditorjsBlocks(props.content)

    editor = new Editorjs({
      holder: holder.value,
      autofocus: false,
      data: {
        blocks,
      },
      onChange: () => {
        scheduleContentSync()
      },
      tools: {
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
        table: {
          class: Table,
          inlineToolbar: true,
        },
      },
    })

    await editor.isReady

    lastRenderedContent = props.content
  } catch (error) {
    editorError.value =
      error instanceof Error ? error.message : 'Failed to load the editor'
  } finally {
    isEditorLoading.value = false
  }
})

watch(
  () => props.content,
  (nextContent) => {
    if (!editor || nextContent === lastRenderedContent) {
      return
    }

    void renderMarkdownContent(nextContent)
  },
)

onBeforeUnmount(() => {
  if (contentSyncTimeout) {
    clearTimeout(contentSyncTimeout)
    contentSyncTimeout = null
  }

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
          Loading editor...
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
          Loading editor...
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
