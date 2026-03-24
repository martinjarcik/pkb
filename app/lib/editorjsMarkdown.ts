import { remark } from 'remark'
import remarkGfm from 'remark-gfm'

export type EditorjsBlock = {
  type: string
  data: Record<string, unknown>
}

type MarkdownNode = {
  type: string
  value?: string
  depth?: number
  ordered?: boolean
  lang?: string | null
  url?: string
  align?: Array<'left' | 'center' | 'right' | null>
  children?: MarkdownNode[]
}

function parseMarkdown(markdown: string): MarkdownNode {
  return remark().use(remarkGfm).parse(markdown) as MarkdownNode
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function parseInlineNodeToHtml(node: MarkdownNode): string {
  switch (node.type) {
    case 'text':
      return node.value ?? ''
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

function parseParagraph(node: MarkdownNode): EditorjsBlock {
  return {
    type: 'paragraph',
    data: {
      text: parseInlineNodesToHtml(node.children),
    },
  }
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

function parseList(node: MarkdownNode): EditorjsBlock {
  return {
    type: 'list',
    data: {
      items: (node.children ?? []).map((item) => parseListItem(item)),
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

function parseBlockquote(node: MarkdownNode): EditorjsBlock {
  const lines = (node.children ?? [])
    .map((child) => parseInlineNodesToHtml(child.children))
    .filter(isNonEmptyString)

  return {
    type: 'paragraph',
    data: {
      text: lines.map((line) => `> ${line}`).join('\n'),
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

function parseMarkdownNode(node: MarkdownNode): EditorjsBlock | null {
  switch (node.type) {
    case 'heading':
      return parseHeading(node)
    case 'paragraph':
      return parseParagraph(node)
    case 'list':
      return parseList(node)
    case 'thematicBreak':
      return parseDelimiter()
    case 'code':
      return parseCode(node)
    case 'blockquote':
      return parseBlockquote(node)
    case 'table':
      return parseTable(node)
    default:
      return null
  }
}

function normalizeCellValue(value: unknown): string {
  const normalizedValue = value === undefined || value === null ? '' : value

  return String(normalizedValue)
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
      return `${'#'.repeat(level)} ${String(block.data.text ?? '')}`.trimEnd()
    }
    case 'paragraph':
      return String(block.data.text ?? '')
    case 'list': {
      const items = Array.isArray(block.data.items) ? block.data.items : []
      const style = block.data.style === 'ordered' ? 'ordered' : 'unordered'

      return items
        .map((item, index) =>
          style === 'ordered'
            ? `${index + 1}. ${String(item)}`
            : `- ${String(item)}`,
        )
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
  if (markdown.trim().length === 0) {
    return []
  }

  const parsedMarkdown = parseMarkdown(markdown)

  return (parsedMarkdown.children ?? [])
    .map((child) => parseMarkdownNode(child))
    .filter((block): block is EditorjsBlock => block !== null)
}

export function editorjsBlocksToMarkdown(blocks: EditorjsBlock[]): string {
  if (blocks.length === 0) {
    return ''
  }

  return blocks
    .map((block) => renderMarkdownBlock(block))
    .filter(isNonEmptyString)
    .join('\n\n')
    .trimEnd()
}
