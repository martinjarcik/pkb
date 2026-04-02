import {
  INLINE_HIGHLIGHT_DEFAULT_COLOR,
  inlineHighlightMarkdownPrefix,
  isInlineHighlightColor,
  type InlineHighlightStyle,
} from './inlineHighlight'
import {
  VAULT_ASSETS_API_PREFIX,
  type EditorjsBlock,
} from './editorjsMarkdownTypes'

function editorHtmlLineBreaksToMarkdownNewlines(text: string): string {
  return text.replace(/\u200B/g, '').replace(/<br\b[^>]*\/?>/gi, '\n')
}

function inlineHtmlToMarkdown(text: string): string {
  let normalized = editorHtmlLineBreaksToMarkdownNewlines(text)
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')

  const replacements: Array<[RegExp, (...args: string[]) => string]> = [
    [
      /<mark\b([^>]*)class=(["'])[^"']*\binline-highlight\b[^"']*\2([^>]*)>([\s\S]*?)<\/mark>/gi,
      (_match, beforeClass, _quote, afterClass, content) => {
        const attrs = `${beforeClass}${afterClass}`
        const bgMatch = attrs.match(/\bdata-bg=(["'])(.*?)\1/i)
        const textMatch = attrs.match(/\bdata-text=(["'])(.*?)\1/i)
        const colorMatch = attrs.match(/\bdata-color=(["'])(.*?)\1/i)

        let style: InlineHighlightStyle

        if (bgMatch || textMatch) {
          const bgRaw = bgMatch?.[2]
          const textRaw = textMatch?.[2]
          style = {
            bgColor: bgRaw && isInlineHighlightColor(bgRaw) ? bgRaw : null,
            textColor:
              textRaw && isInlineHighlightColor(textRaw) ? textRaw : null,
          }
        } else if (colorMatch) {
          const raw = colorMatch[2]
          const bgColor =
            raw && isInlineHighlightColor(raw)
              ? raw
              : INLINE_HIGHLIGHT_DEFAULT_COLOR
          style = { bgColor, textColor: null }
        } else {
          style = {
            bgColor: INLINE_HIGHLIGHT_DEFAULT_COLOR,
            textColor: null,
          }
        }

        const prefix = inlineHighlightMarkdownPrefix(style)
        return `==${prefix}${content}==`
      },
    ],
    [
      /<span\b[^>]*class=(["'])[^"']*\binline-hashtag\b[^"']*\1[^>]*>([\s\S]*?)<\/span>/gi,
      (_match, _quote, content) => content,
    ],
    [
      /<code\b[^>]*>([\s\S]*?)<\/code>/gi,
      (_match, content) => `\`${content}\``,
    ],
    [
      /<strong\b[^>]*\binline-big-emoji\b[^>]*>([\s\S]*?)<\/strong>/gi,
      (_match, content) => `__${content}__`,
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

function blockRequiresBlankLineSeparator(type: string): boolean {
  return type === 'list' || type === 'image'
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

function isEmptyParagraphBlock(block: EditorjsBlock): boolean {
  return (
    block.type === 'paragraph' && String(block.data.text ?? '').length === 0
  )
}

function markdownUrlFromEditorImageFileUrl(fileUrl: string): string {
  const prefix = `${VAULT_ASSETS_API_PREFIX}/`

  if (fileUrl.startsWith(prefix)) {
    return fileUrl.slice(prefix.length)
  }

  return fileUrl
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

function renderBlockComment(block: EditorjsBlock): string {
  if (!block.cssClasses || block.cssClasses.length === 0) {
    return ''
  }

  return `<!-- block: ${block.cssClasses.join(' ')} -->\n`
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
    case 'image': {
      const file = block.data.file
      const fileUrl =
        file && typeof file === 'object' && file !== null && 'url' in file
          ? String((file as { url?: unknown }).url ?? '')
          : ''
      const url = markdownUrlFromEditorImageFileUrl(fileUrl)
      const caption = String(block.data.caption ?? '')

      return `![${caption}](${url})`
    }
    default:
      return ''
  }
}

export function editorjsBlocksToMarkdown(blocks: EditorjsBlock[]): string {
  const normalizedBlocks = blocks.filter((block) => block.type !== 'noteTitle')

  while (
    normalizedBlocks.length > 0 &&
    isEmptyParagraphBlock(normalizedBlocks[normalizedBlocks.length - 1]!)
  ) {
    normalizedBlocks.pop()
  }

  if (normalizedBlocks.length === 0) {
    return ''
  }

  let index = 0
  let leadingBlanks = 0

  while (
    index < normalizedBlocks.length &&
    isEmptyParagraphBlock(normalizedBlocks[index]!)
  ) {
    leadingBlanks += 1
    index += 1
  }

  const substantive: EditorjsBlock[] = []
  const blanksBeforeEach: number[] = []
  let pendingBlanks = leadingBlanks

  for (; index < normalizedBlocks.length; index += 1) {
    const block = normalizedBlocks[index]!

    if (isEmptyParagraphBlock(block)) {
      pendingBlanks += 1
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

  for (let blockIndex = 0; blockIndex < substantive.length; blockIndex += 1) {
    const block = substantive[blockIndex]!
    const markdown = renderMarkdownBlock(block)
    const comment = renderBlockComment(block)
    const blanksBefore = blanksBeforeEach[blockIndex]!

    if (blockIndex === 0) {
      result += '\n'.repeat(blanksBefore) + comment + markdown
    } else {
      result +=
        '\n'.repeat(
          newlinesBetweenSubstantive(
            substantive[blockIndex - 1]!.type,
            substantive[blockIndex]!.type,
            blanksBefore,
          ),
        ) +
        comment +
        markdown
    }
  }

  result += '\n'.repeat(trailingBlanks)

  return result
}
