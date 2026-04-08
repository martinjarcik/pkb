import type { EditorjsBlock } from './editorjsMarkdownTypes'
import { BIG_EMOJI_STICK_BLOCK_CLASS, hasStickBigEmojiHtml } from './bigEmoji'
import { markdownUrlFromEditorImageFileUrl } from './editorjsImageUrl'
import { inlineHtmlToMarkdown } from './editorjsInlineNormalization'

// This file is a conversion hotspot. Keep behavior explicit and prefer small,
// local extractions when future changes touch one branch of the serializer.
type MarkdownImageUrlResolver = (fileUrl: string) => string

function identityMarkdownImageUrl(fileUrl: string): string {
  return fileUrl
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

function collectBlockCommentTokens(block: EditorjsBlock): string[] {
  const tokens = block.cssClasses ? [...block.cssClasses] : []
  const text = typeof block.data.text === 'string' ? block.data.text : ''

  if (
    !tokens.includes(BIG_EMOJI_STICK_BLOCK_CLASS) &&
    hasStickBigEmojiHtml(text)
  ) {
    tokens.push(BIG_EMOJI_STICK_BLOCK_CLASS)
  }

  if (block.type === 'image' && block.data.stretched === true) {
    tokens.push('image-stretch')
  }

  return tokens
}

function renderBlockComment(block: EditorjsBlock): string {
  const tokens = collectBlockCommentTokens(block)

  if (tokens.length === 0) {
    return ''
  }

  return `<!-- block: ${tokens.join(' ')} -->\n`
}

function renderMarkdownBlock(
  block: EditorjsBlock,
  resolveMarkdownImageUrl: MarkdownImageUrlResolver,
): string {
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
      const url = markdownUrlFromEditorImageFileUrl(
        fileUrl,
        resolveMarkdownImageUrl,
      )
      const caption = String(block.data.caption ?? '')

      return `![${caption}](${url})`
    }
    default:
      return ''
  }
}

export function editorjsBlocksToMarkdown(
  blocks: EditorjsBlock[],
  resolveMarkdownImageUrl?: MarkdownImageUrlResolver,
): string {
  const markdownImageUrlResolver =
    resolveMarkdownImageUrl ?? identityMarkdownImageUrl
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
    const markdown = renderMarkdownBlock(block, markdownImageUrlResolver)
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
