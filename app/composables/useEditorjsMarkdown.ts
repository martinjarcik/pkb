export type EditorjsBlock = {
  type: string
  data: Record<string, unknown>
}

type EditorjsMarkdownModule = {
  MDfromBlocks(blocks: EditorjsBlock[]): Promise<string> | string
  MDtoBlocks(markdown: string): Promise<EditorjsBlock[]> | EditorjsBlock[]
}

type EditorjsMarkdownImport = {
  default?: EditorjsMarkdownModule
  'module.exports'?: EditorjsMarkdownModule
}

let editorjsMarkdownModulePromise: Promise<EditorjsMarkdownModule> | null = null

function isEditorjsMarkdownModule(
  value: unknown,
): value is EditorjsMarkdownModule {
  return (
    typeof value === 'object' &&
    value !== null &&
    'MDtoBlocks' in value &&
    typeof value.MDtoBlocks === 'function' &&
    'MDfromBlocks' in value &&
    typeof value.MDfromBlocks === 'function'
  )
}

export function resolveEditorjsMarkdownModule(
  module: unknown,
): EditorjsMarkdownModule {
  const candidates = [
    module,
    (module as EditorjsMarkdownImport | undefined)?.default,
    (module as EditorjsMarkdownImport | undefined)?.['module.exports'],
    (module as { default?: EditorjsMarkdownImport } | undefined)?.default
      ?.default,
    (module as { default?: EditorjsMarkdownImport } | undefined)?.default?.[
      'module.exports'
    ],
  ]

  for (const candidate of candidates) {
    if (isEditorjsMarkdownModule(candidate)) {
      return candidate
    }
  }

  throw new Error('Editor.js markdown converter failed to load')
}

function withSuppressedConsoleLogs<T>(callback: () => Promise<T>): Promise<T> {
  const originalLog = console.log

  console.log = () => undefined

  return callback().finally(() => {
    console.log = originalLog
  })
}

function ensureBrowserEnvironment(): void {
  if (typeof window === 'undefined') {
    throw new Error(
      'Editor.js markdown conversion requires a browser environment',
    )
  }
}

async function loadEditorjsMarkdownModule(): Promise<EditorjsMarkdownModule> {
  ensureBrowserEnvironment()

  if (!editorjsMarkdownModulePromise) {
    editorjsMarkdownModulePromise = import('editorjs-md-parser').then(
      (module) => resolveEditorjsMarkdownModule(module),
    )
  }

  return editorjsMarkdownModulePromise
}

export async function markdownToEditorjsBlocks(
  markdown: string,
): Promise<EditorjsBlock[]> {
  if (markdown.trim().length === 0) {
    return []
  }

  return withSuppressedConsoleLogs(async () => {
    const editorjsMarkdown = await loadEditorjsMarkdownModule()
    const blocks = await editorjsMarkdown.MDtoBlocks(markdown)

    return blocks as EditorjsBlock[]
  })
}

export async function editorjsBlocksToMarkdown(
  blocks: EditorjsBlock[],
): Promise<string> {
  if (blocks.length === 0) {
    return ''
  }

  const editorjsMarkdown = await loadEditorjsMarkdownModule()
  const markdown = await editorjsMarkdown.MDfromBlocks(blocks)

  return String(markdown).trimEnd()
}

export function useEditorjsMarkdown() {
  return {
    editorjsBlocksToMarkdown,
    markdownToEditorjsBlocks,
  }
}
