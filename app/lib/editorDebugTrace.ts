import {
  hasBigEmojiBigMarker,
  hasStickBigEmojiHtml,
  type BigEmojiSize,
} from './bigEmoji'
import type { EditorjsBlock } from './editorjsMarkdownTypes'

type EditorDebugEntry = {
  sequence: number
  at: string
  event: string
  data: Record<string, unknown>
}

type EditorDebugApi = {
  clear(): void
  disableConsole(): void
  dump(): EditorDebugEntry[]
  enableConsole(): void
  getEntries(): EditorDebugEntry[]
}

declare global {
  interface Window {
    __PKB_EDITOR_DEBUG__?: EditorDebugApi
  }
}

const DEBUG_CONSOLE_STORAGE_KEY = 'pkb:editor-debug-console'
const DEBUG_BUFFER_STORAGE_KEY = 'pkb:editor-debug-buffer'
const DEBUG_ENTRY_LIMIT = 250
const BLOCK_COMMENT_PATTERN = /^<!--\s*block:\s*(.*?)\s*-->$/gm

let debugEntries: EditorDebugEntry[] | null = null
let debugSequence = 0
let traceSequence = 0

function canUseWindow(): boolean {
  return typeof window !== 'undefined'
}

function loadPersistedEntries(): EditorDebugEntry[] {
  if (!canUseWindow()) {
    return []
  }

  try {
    const raw = window.sessionStorage.getItem(DEBUG_BUFFER_STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(
        (entry): entry is EditorDebugEntry =>
          entry !== null &&
          typeof entry === 'object' &&
          typeof (entry as { sequence?: unknown }).sequence === 'number' &&
          typeof (entry as { at?: unknown }).at === 'string' &&
          typeof (entry as { event?: unknown }).event === 'string' &&
          typeof (entry as { data?: unknown }).data === 'object' &&
          (entry as { data?: unknown }).data !== null,
      )
      .slice(-DEBUG_ENTRY_LIMIT)
  } catch {
    return []
  }
}

function ensureEntries(): EditorDebugEntry[] {
  if (debugEntries !== null) {
    return debugEntries
  }

  debugEntries = loadPersistedEntries()
  const lastSequence = debugEntries[debugEntries.length - 1]?.sequence ?? 0

  debugSequence = lastSequence

  return debugEntries
}

function persistEntries(): void {
  if (!canUseWindow() || debugEntries === null) {
    return
  }

  try {
    window.sessionStorage.setItem(
      DEBUG_BUFFER_STORAGE_KEY,
      JSON.stringify(debugEntries),
    )
  } catch {
    // Ignore debug persistence failures.
  }
}

function isConsoleDebugEnabled(): boolean {
  if (!canUseWindow()) {
    return false
  }

  try {
    return window.localStorage.getItem(DEBUG_CONSOLE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function ensureDebugApi(): void {
  if (!canUseWindow() || window.__PKB_EDITOR_DEBUG__) {
    return
  }

  window.__PKB_EDITOR_DEBUG__ = {
    clear() {
      const entries = ensureEntries()

      entries.length = 0
      persistEntries()
    },
    disableConsole() {
      try {
        window.localStorage.removeItem(DEBUG_CONSOLE_STORAGE_KEY)
      } catch {
        // Ignore debug console preference failures.
      }
    },
    dump() {
      return ensureEntries().slice()
    },
    enableConsole() {
      try {
        window.localStorage.setItem(DEBUG_CONSOLE_STORAGE_KEY, '1')
      } catch {
        // Ignore debug console preference failures.
      }
    },
    getEntries() {
      return ensureEntries().slice()
    },
  }
}

function summarizeText(value: string): string {
  const flattened = value.replace(/\s+/g, ' ').trim()

  if (flattened.length <= 160) {
    return flattened
  }

  return `${flattened.slice(0, 157)}...`
}

function summarizeBigEmojiSize(text: string): BigEmojiSize | null {
  if (
    /\bdata-size=(["'])big\1/.test(text) ||
    /\binline-big-emoji-big\b/.test(text)
  ) {
    return 'big'
  }

  if (
    /\bdata-size=(["'])bigger\1/.test(text) ||
    /\binline-big-emoji-bigger\b/.test(text)
  ) {
    return 'bigger'
  }

  if (/\binline-big-emoji\b/.test(text)) {
    return 'default'
  }

  return null
}

function summarizeBlock(
  block: EditorjsBlock,
  index: number,
): Record<string, unknown> {
  const summary: Record<string, unknown> = {
    index,
    type: block.type,
  }

  if (block.cssClasses && block.cssClasses.length > 0) {
    summary.cssClasses = [...block.cssClasses]
  }

  if (block.tunes && Object.keys(block.tunes).length > 0) {
    summary.tunes = block.tunes
  }

  const text = typeof block.data.text === 'string' ? block.data.text : null

  if (text !== null) {
    summary.text = summarizeText(text)
    summary.bigEmojiSize = summarizeBigEmojiSize(text)
    summary.hasBigEmojiMarker = hasBigEmojiBigMarker(text)
    summary.hasStickHtml = hasStickBigEmojiHtml(text)
  }

  if (block.type === 'image') {
    summary.caption =
      typeof block.data.caption === 'string' ? block.data.caption : null
    summary.stretched = block.data.stretched === true
    summary.fileUrl =
      block.data.file &&
      typeof block.data.file === 'object' &&
      block.data.file !== null &&
      'url' in block.data.file
        ? String((block.data.file as { url?: unknown }).url ?? '')
        : null
  }

  return summary
}

export function summarizeBlocksForDebug(
  blocks: EditorjsBlock[],
): Record<string, unknown>[] {
  return blocks.map((block, index) => summarizeBlock(block, index))
}

export function summarizeMarkdownForDebug(
  markdown: string,
): Record<string, unknown> {
  const comments = Array.from(markdown.matchAll(BLOCK_COMMENT_PATTERN)).map(
    (match) => match[1]!,
  )

  return {
    blockComments: comments,
    length: markdown.length,
    lineCount: markdown.length === 0 ? 0 : markdown.split('\n').length,
    preview: summarizeText(markdown),
  }
}

export function createEditorDebugTraceId(label: string): string {
  traceSequence += 1
  return `${label}-${traceSequence}`
}

export function logEditorDebug(
  event: string,
  data: Record<string, unknown>,
): void {
  const entries = ensureEntries()
  ensureDebugApi()

  const entry: EditorDebugEntry = {
    sequence: debugSequence + 1,
    at: new Date().toISOString(),
    event,
    data,
  }

  debugSequence = entry.sequence
  entries.push(entry)

  if (entries.length > DEBUG_ENTRY_LIMIT) {
    entries.splice(0, entries.length - DEBUG_ENTRY_LIMIT)
  }

  persistEntries()

  if (isConsoleDebugEnabled()) {
    console.debug('[pkb][editor-debug]', entry)
  }
}
