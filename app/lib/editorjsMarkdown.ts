import { remark } from 'remark'
import remarkGfm from 'remark-gfm'

export type EditorjsBlock = {
  type: string
  data: Record<string, unknown>
}

type MdPoint = {
  line: number
  column: number
  offset: number
}

type MdPosition = {
  start: MdPoint
  end: MdPoint
}

type MarkdownNode = {
  type: string
  value?: string
  depth?: number
  ordered?: boolean
  /** GFM task list: true / false; `null` when the line is not a task item. */
  checked?: boolean | null
  lang?: string | null
  url?: string
  align?: Array<'left' | 'center' | 'right' | null>
  children?: MarkdownNode[]
  position?: MdPosition
}

const LIST_ITEM_LINE = /^(\s*)([*+-]|\d+\.)(\s)/

function isMarkdownListItemLine(line: string): boolean {
  return LIST_ITEM_LINE.test(line)
}

function dedentMarkdownListRun(lines: string[]): string[] {
  const indents = lines.map((l) => {
    const m = l.match(LIST_ITEM_LINE)
    const ws = m?.[1]
    return ws !== undefined ? ws.length : 0
  })
  const minIndent = Math.min(...indents)
  if (minIndent === 0) {
    return lines
  }

  return lines.map((line) =>
    isMarkdownListItemLine(line) ? line.slice(minIndent) : line,
  )
}

function dedentContiguousMarkdownListRuns(prose: string): string {
  const lines = prose.split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!
    if (!isMarkdownListItemLine(line)) {
      out.push(line)
      i++
      continue
    }

    const start = i
    i++
    while (i < lines.length && isMarkdownListItemLine(lines[i]!)) {
      i++
    }

    out.push(...dedentMarkdownListRun(lines.slice(start, i)))
  }

  return out.join('\n')
}

function transformProseOutsideFencedCodeBlocks(
  markdown: string,
  transformProse: (prose: string) => string,
): string {
  const lines = markdown.split('\n')
  const segments: string[] = []
  let proseBuf: string[] = []
  let fenceBuf: string[] = []
  let inFence = false

  const flushProse = () => {
    if (proseBuf.length > 0) {
      segments.push(transformProse(proseBuf.join('\n')))
      proseBuf = []
    }
  }

  const flushFence = () => {
    if (fenceBuf.length > 0) {
      segments.push(fenceBuf.join('\n'))
      fenceBuf = []
    }
  }

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (!inFence) {
        flushProse()
        inFence = true
        fenceBuf.push(line)
      } else {
        fenceBuf.push(line)
        flushFence()
        inFence = false
      }
    } else if (inFence) {
      fenceBuf.push(line)
    } else {
      proseBuf.push(line)
    }
  }

  flushProse()
  if (fenceBuf.length > 0) {
    segments.push(fenceBuf.join('\n'))
  }

  return segments.join('\n')
}

function parseMarkdown(markdown: string): MarkdownNode {
  return remark().use(remarkGfm).parse(markdown) as MarkdownNode
}

function normalizeMarkdownProse(markdown: string): string {
  return dedentContiguousMarkdownListRuns(inlineHtmlToMarkdown(markdown))
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function countNewlines(text: string): number {
  return text.match(/\n/g)?.length ?? 0
}

function emptyParagraphsForBlockGap(
  _prevType: string,
  _nextType: string,
  gapNewlines: number,
): number {
  if (gapNewlines < 2) {
    return 0
  }

  return gapNewlines - 1
}

function editorHtmlLineBreaksToMarkdownNewlines(text: string): string {
  return text.replace(/<br\b[^>]*\/?>/gi, '\n')
}

function inlineHtmlToMarkdown(text: string): string {
  let normalized = editorHtmlLineBreaksToMarkdownNewlines(text)

  const replacements: Array<[RegExp, (...args: string[]) => string]> = [
    [
      /<code\b[^>]*>([\s\S]*?)<\/code>/gi,
      (_match, content) => `\`${content}\``,
    ],
    [
      /<(i|em)\b[^>]*>([\s\S]*?)<\/\1>/gi,
      (_match, _tag, content) => `*${content}*`,
    ],
    [
      /<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi,
      (_match, _tag, content) => `**${content}**`,
    ],
    [
      /<(s|del)\b[^>]*>([\s\S]*?)<\/\1>/gi,
      (_match, _tag, content) => `~~${content}~~`,
    ],
    [
      /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi,
      (_match, _quote, href, content) => `[${content}](${href})`,
    ],
  ]

  for (const [pattern, replacer] of replacements) {
    let previous = ''

    while (normalized !== previous) {
      previous = normalized
      normalized = normalized.replace(pattern, replacer)
    }
  }

  return normalized
}

function markdownNewlinesToEditorHtml(text: string): string {
  return text.replace(/\n/g, '<br>')
}

function blockRequiresBlankLineSeparator(type: string): boolean {
  return type === 'list'
}

function newlinesBetweenSubstantive(
  prevType: string,
  nextType: string,
  blanksBefore: number,
): number {
  if (blanksBefore <= 0) {
    if (
      (prevType === 'header' && nextType === 'list') ||
      (prevType === 'list' && nextType === 'header')
    ) {
      return 1
    }

    if (
      blockRequiresBlankLineSeparator(prevType) ||
      blockRequiresBlankLineSeparator(nextType)
    ) {
      return 2
    }

    return 1
  }

  return blanksBefore + 1
}

function emptyParagraphBlock(): EditorjsBlock {
  return {
    type: 'paragraph',
    data: {
      text: '',
    },
  }
}

function isEmptyParagraphBlock(block: EditorjsBlock): boolean {
  return (
    block.type === 'paragraph' && String(block.data.text ?? '').length === 0
  )
}

function blocksFromRootWithBlankLines(
  source: string,
  root: MarkdownNode,
): EditorjsBlock[] {
  const children = root.children ?? []
  const out: EditorjsBlock[] = []

  for (let i = 0; i < children.length; i++) {
    const node = children[i]!
    const pos = node.position
    const startOffset = pos?.start.offset
    const endOffset = pos?.end.offset

    if (startOffset !== undefined && endOffset !== undefined) {
      if (i === 0) {
        const leading = source.slice(0, startOffset)
        for (let n = 0; n < countNewlines(leading); n++) {
          out.push(emptyParagraphBlock())
        }
      } else {
        const prev = children[i - 1]!
        const prevEnd = prev.position?.end.offset
        if (prevEnd !== undefined) {
          const gap = source.slice(prevEnd, startOffset)
          const extra = emptyParagraphsForBlockGap(
            prev.type,
            node.type,
            countNewlines(gap),
          )
          for (let n = 0; n < extra; n++) {
            out.push(emptyParagraphBlock())
          }
        }
      }
    }

    out.push(...parseMarkdownNode(node))
  }

  const last = children[children.length - 1]
  const lastEnd = last?.position?.end.offset
  if (lastEnd !== undefined && children.length > 0) {
    const trailing = source.slice(lastEnd)
    const extraTrail = Math.max(0, countNewlines(trailing) - 1)
    for (let n = 0; n < extraTrail; n++) {
      out.push(emptyParagraphBlock())
    }
  }

  return out
}

function parseInlineNodeToHtml(node: MarkdownNode): string {
  switch (node.type) {
    case 'text':
      return markdownNewlinesToEditorHtml(node.value ?? '')
    case 'emphasis':
      return `<i>${parseInlineNodesToHtml(node.children)}</i>`
    case 'strong':
      return `<b>${parseInlineNodesToHtml(node.children)}</b>`
    case 'delete':
      return `<s>${parseInlineNodesToHtml(node.children)}</s>`
    case 'inlineCode':
      return `<code class="inline-code">${node.value ?? ''}</code>`
    case 'link':
      return `<a href="${node.url ?? ''}">${parseInlineNodesToHtml(node.children)}</a>`
    case 'break':
      return '<br>'
    case 'html':
      return node.value ?? ''
    default:
      return parseInlineNodesToHtml(node.children)
  }
}

function parseInlineNodesToHtml(children: MarkdownNode[] | undefined): string {
  return (children ?? []).map((child) => parseInlineNodeToHtml(child)).join('')
}

function parseHeading(node: MarkdownNode): EditorjsBlock {
  const level = Math.min(Math.max(node.depth ?? 1, 1), 6)

  return {
    type: 'header',
    data: {
      level,
      text: parseInlineNodesToHtml(node.children),
    },
  }
}

function createParagraphBlock(text: string): EditorjsBlock {
  return {
    type: 'paragraph',
    data: {
      text,
    },
  }
}

function parseParagraph(node: MarkdownNode): EditorjsBlock[] {
  return parseInlineNodesToHtml(node.children)
    .split(/<br\b[^>]*\/?>/i)
    .map((line) => createParagraphBlock(line))
}

function parseListItem(node: MarkdownNode): string {
  return (node.children ?? [])
    .map((child) => {
      if (child.type === 'paragraph') {
        return parseInlineNodesToHtml(child.children)
      }

      return parseInlineNodeToHtml(child)
    })
    .filter(isNonEmptyString)
    .join(' ')
}

function listContainsTaskItems(items: MarkdownNode[]): boolean {
  return items.some((item) => typeof item.checked === 'boolean')
}

function parseList(node: MarkdownNode): EditorjsBlock {
  const listItems = node.children ?? []

  if (listContainsTaskItems(listItems)) {
    return {
      type: 'list',
      data: {
        style: 'checklist',
        meta: {},
        items: listItems.map((item) => ({
          content: parseListItem(item),
          meta: {
            checked: typeof item.checked === 'boolean' ? item.checked : false,
          },
          items: [],
        })),
      },
    }
  }

  return {
    type: 'list',
    data: {
      items: listItems.map((item) => parseListItem(item)),
      style: node.ordered ? 'ordered' : 'unordered',
    },
  }
}

function parseDelimiter(): EditorjsBlock {
  return {
    type: 'delimiter',
    data: {
      items: [],
    },
  }
}

function parseCode(node: MarkdownNode): EditorjsBlock {
  return {
    type: 'code',
    data: {
      code: node.value ?? '',
    },
  }
}

function normalizeSimpleQuoteText(text: string): string {
  return text
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/<br\b[^>]*\/?>/gi, ' ')
    .trim()
}

function parseBlockquote(node: MarkdownNode): EditorjsBlock {
  const firstParagraph = (node.children ?? []).find(
    (child) => child.type === 'paragraph',
  )

  return {
    type: 'simpleQuote',
    data: {
      text: normalizeSimpleQuoteText(
        parseInlineNodesToHtml(firstParagraph?.children),
      ),
    },
  }
}

function parseTable(node: MarkdownNode): EditorjsBlock {
  const rows = node.children ?? []
  const content = rows.map((row) =>
    (row.children ?? []).map((cell) => parseInlineNodesToHtml(cell.children)),
  )
  const alignments = node.align ?? []

  return {
    type: 'table',
    data: {
      alignments: alignments.length > 0 ? alignments : undefined,
      content,
      stretched: false,
      withHeadings: true,
    },
  }
}

function parseMarkdownNode(node: MarkdownNode): EditorjsBlock[] {
  switch (node.type) {
    case 'heading':
      return [parseHeading(node)]
    case 'paragraph':
      return parseParagraph(node)
    case 'list':
      return [parseList(node)]
    case 'thematicBreak':
      return [parseDelimiter()]
    case 'code':
      return [parseCode(node)]
    case 'blockquote':
      return [parseBlockquote(node)]
    case 'table':
      return [parseTable(node)]
    default:
      return []
  }
}

function normalizeCellValue(value: unknown): string {
  const normalizedValue = value === undefined || value === null ? '' : value

  return inlineHtmlToMarkdown(String(normalizedValue))
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '<br>')
    .replace(/\|/g, '\\|')
}

function renderAlignmentCell(alignment: unknown): string {
  switch (alignment) {
    case 'left':
      return ':---'
    case 'center':
      return ':---:'
    case 'right':
      return '---:'
    default:
      return '---'
  }
}

type NormalizedListItem = {
  content: string
  checked: boolean
}

function normalizeListItemRecord(item: unknown): NormalizedListItem {
  if (typeof item === 'string') {
    return { content: item, checked: false }
  }

  if (item === null || typeof item !== 'object') {
    return { content: '', checked: false }
  }

  const record = item as Record<string, unknown>
  const rawContent = record.content ?? record.text
  const content =
    typeof rawContent === 'string' ? rawContent : String(rawContent ?? '')
  const meta = record.meta
  const fromMeta =
    meta !== null &&
    typeof meta === 'object' &&
    typeof (meta as { checked?: unknown }).checked === 'boolean'
      ? (meta as { checked: boolean }).checked
      : undefined
  const checked =
    typeof record.checked === 'boolean'
      ? record.checked
      : fromMeta !== undefined
        ? fromMeta
        : false

  return { content, checked }
}

function renderTableMarkdown(data: Record<string, unknown>): string {
  const rawContent = Array.isArray(data.content) ? data.content : []
  const content = rawContent.filter((row): row is unknown[] =>
    Array.isArray(row),
  )

  if (content.length === 0) {
    return ''
  }

  const columnCount = content.reduce(
    (count, row) => Math.max(count, row.length),
    0,
  )

  if (columnCount === 0) {
    return ''
  }

  const rawAlignments = Array.isArray(data.alignments)
    ? data.alignments
    : Array.isArray(data.align)
      ? data.align
      : []
  const alignments = Array.from({ length: columnCount }, (_, index) =>
    renderAlignmentCell(rawAlignments[index]),
  )
  const withHeadings = Boolean(data.withHeadings)
  const headerRow =
    withHeadings && content[0] ? content[0] : new Array(columnCount).fill('')
  const bodyRows = withHeadings ? content.slice(1) : content

  const renderRow = (row: unknown[]) =>
    `| ${Array.from({ length: columnCount }, (_, index) => normalizeCellValue(row[index])).join(' | ')} |`

  return [
    renderRow(headerRow),
    `| ${alignments.join(' | ')} |`,
    ...bodyRows.map((row) => renderRow(row)),
  ].join('\n')
}

function renderMarkdownBlock(block: EditorjsBlock): string {
  switch (block.type) {
    case 'header': {
      const level = Math.min(Math.max(Number(block.data.level ?? 1) || 1, 1), 6)
      const text = inlineHtmlToMarkdown(String(block.data.text ?? ''))
      return `${'#'.repeat(level)} ${text}`.trimEnd()
    }
    case 'paragraph':
      return inlineHtmlToMarkdown(String(block.data.text ?? ''))
    case 'simpleQuote':
      return `> ${inlineHtmlToMarkdown(String(block.data.text ?? ''))}`
    case 'list': {
      const items = Array.isArray(block.data.items) ? block.data.items : []
      const style =
        block.data.style === 'ordered'
          ? 'ordered'
          : block.data.style === 'checklist'
            ? 'checklist'
            : 'unordered'

      if (style === 'checklist') {
        return items
          .map((item) => {
            const { content, checked } = normalizeListItemRecord(item)
            const line = inlineHtmlToMarkdown(content)
            const mark = checked ? '[x]' : '[ ]'

            return `- ${mark} ${line}`.trimEnd()
          })
          .join('\n')
      }

      return items
        .map((item, index) => {
          const { content } = normalizeListItemRecord(item)
          const line = inlineHtmlToMarkdown(content)

          return style === 'ordered' ? `${index + 1}. ${line}` : `- ${line}`
        })
        .join('\n')
    }
    case 'delimiter':
      return '---'
    case 'code':
      return `\`\`\`\n${String(block.data.code ?? '')}\n\`\`\``
    case 'table':
      return renderTableMarkdown(block.data)
    default:
      return ''
  }
}

export function markdownToEditorjsBlocks(markdown: string): EditorjsBlock[] {
  if (markdown.length === 0) {
    return []
  }

  const normalizedMarkdown = transformProseOutsideFencedCodeBlocks(
    markdown,
    normalizeMarkdownProse,
  )
  const parsedMarkdown = parseMarkdown(normalizedMarkdown)
  const children = parsedMarkdown.children ?? []

  if (children.length === 0) {
    if (!/\S/u.test(normalizedMarkdown)) {
      const blankLines = countNewlines(normalizedMarkdown)
      if (blankLines > 0) {
        return Array.from({ length: blankLines }, emptyParagraphBlock)
      }
    }

    return []
  }

  return blocksFromRootWithBlankLines(normalizedMarkdown, parsedMarkdown)
}

export function editorjsBlocksToMarkdown(blocks: EditorjsBlock[]): string {
  const normalizedBlocks = [...blocks]

  while (
    normalizedBlocks.length > 0 &&
    isEmptyParagraphBlock(normalizedBlocks[normalizedBlocks.length - 1]!)
  ) {
    normalizedBlocks.pop()
  }

  if (normalizedBlocks.length === 0) {
    return ''
  }

  let i = 0
  let leadingBlanks = 0
  while (
    i < normalizedBlocks.length &&
    isEmptyParagraphBlock(normalizedBlocks[i]!)
  ) {
    leadingBlanks++
    i++
  }

  const substantive: EditorjsBlock[] = []
  const blanksBeforeEach: number[] = []
  let pendingBlanks = leadingBlanks

  for (; i < normalizedBlocks.length; i++) {
    const block = normalizedBlocks[i]!
    if (isEmptyParagraphBlock(block)) {
      pendingBlanks++
    } else {
      substantive.push(block)
      blanksBeforeEach.push(pendingBlanks)
      pendingBlanks = 0
    }
  }

  const trailingBlanks = pendingBlanks

  if (substantive.length === 0) {
    return '\n'.repeat(leadingBlanks)
  }

  let result = ''
  for (let j = 0; j < substantive.length; j++) {
    const md = renderMarkdownBlock(substantive[j]!)
    const blanksBefore = blanksBeforeEach[j]!
    if (j === 0) {
      result += '\n'.repeat(blanksBefore) + md
    } else {
      result +=
        '\n'.repeat(
          newlinesBetweenSubstantive(
            substantive[j - 1]!.type,
            substantive[j]!.type,
            blanksBefore,
          ),
        ) + md
    }
  }

  result += '\n'.repeat(trailingBlanks)

  return result
}
