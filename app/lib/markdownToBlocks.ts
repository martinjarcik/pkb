import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { remarkHighlightMark } from 'remark-highlight-mark'
import { createHashtagPattern } from '~/notes/extractTags'
import {
  isBigEmojiContent,
  renderPlainEmojiAsEditorHtml,
  renderBigEmojiHtml,
  renderBigEmojiMarkdownAsEditorHtml,
} from './bigEmoji'
import { editorDisplayUrlForMarkdownImage } from './editorjsImageUrl'
import { inlineHtmlToMarkdown } from './editorjsInlineNormalization'
import {
  parseInlineHighlightMarkdownPrefix,
  renderInlineHighlightHtml,
} from './inlineHighlight'
import type { EditorjsBlock, MarkdownNode } from './editorjsMarkdownTypes'
import { normalizeSimpleQuoteText } from './simpleQuoteTool'

// This file is a conversion hotspot. Keep behavior explicit and prefer small,
// local extractions when future changes touch one branch of the parser.
const BLOCK_COMMENT_PATTERN = /^<!--\s*block:\s*(.*?)\s*-->$/s
const LIST_ITEM_LINE = /^(\s*)([*+-]|\d+\.)(\s)/
const markdownParser = remark().use(remarkGfm).use(remarkHighlightMark)

type AssetUrlResolver = (relativePath: string) => string

function identityAssetUrl(relativePath: string): string {
  return relativePath
}

function parseBlockCommentClasses(value: string): string[] | null {
  const match = value.trim().match(BLOCK_COMMENT_PATTERN)
  if (!match) return null
  return match[1]!.split(/\s+/).filter((token) => token.length > 0)
}

function isMarkdownListItemLine(line: string): boolean {
  return LIST_ITEM_LINE.test(line)
}

function dedentMarkdownListRun(lines: string[]): string[] {
  const indents = lines.map((line) => {
    const match = line.match(LIST_ITEM_LINE)
    const ws = match?.[1]
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
  const output: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]!

    if (!isMarkdownListItemLine(line)) {
      output.push(line)
      index += 1
      continue
    }

    const start = index
    index += 1

    while (index < lines.length && isMarkdownListItemLine(lines[index]!)) {
      index += 1
    }

    output.push(...dedentMarkdownListRun(lines.slice(start, index)))
  }

  return output.join('\n')
}

function transformProseOutsideFencedCodeBlocks(
  markdown: string,
  transformProse: (prose: string) => string,
): string {
  const lines = markdown.split('\n')
  const segments: string[] = []
  let proseBuffer: string[] = []
  let fenceBuffer: string[] = []
  let inFence = false

  const flushProse = () => {
    if (proseBuffer.length > 0) {
      segments.push(transformProse(proseBuffer.join('\n')))
      proseBuffer = []
    }
  }

  const flushFence = () => {
    if (fenceBuffer.length > 0) {
      segments.push(fenceBuffer.join('\n'))
      fenceBuffer = []
    }
  }

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (!inFence) {
        flushProse()
        inFence = true
        fenceBuffer.push(line)
      } else {
        fenceBuffer.push(line)
        flushFence()
        inFence = false
      }
    } else if (inFence) {
      fenceBuffer.push(line)
    } else {
      proseBuffer.push(line)
    }
  }

  flushProse()

  if (fenceBuffer.length > 0) {
    segments.push(fenceBuffer.join('\n'))
  }

  return segments.join('\n')
}

function parseMarkdown(markdown: string): MarkdownNode {
  return markdownParser.parse(markdown) as MarkdownNode
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

function markdownNewlinesToEditorHtml(text: string): string {
  return text.replace(/\n/g, '<br>')
}

// Keep this hashtag wrapper aligned with the extraction matcher in
// `app/notes/extractTags.ts` and the live editor wrapper in
// `app/lib/editorjsHashtagHighlight.ts`.
function wrapHashtagsForEditorHtml(text: string): string {
  return text.replace(
    createHashtagPattern(),
    (_match, leadingWhitespace, hashtag) =>
      `${leadingWhitespace}<span class="inline-hashtag" contenteditable="false">${hashtag}</span>`,
  )
}

type InlineParseOptions = {
  wrapPlainEmoji: boolean
}

const defaultInlineParseOptions: InlineParseOptions = {
  wrapPlainEmoji: true,
}

function createEmptyParagraphBlock(): EditorjsBlock {
  return {
    type: 'paragraph',
    data: {
      text: '',
    },
  }
}

function blocksFromRootWithBlankLines(
  source: string,
  root: MarkdownNode,
  resolveAssetUrl: AssetUrlResolver | undefined,
): EditorjsBlock[] {
  const children = root.children ?? []
  const output: EditorjsBlock[] = []
  let pendingCssClasses: string[] | null = null

  for (let index = 0; index < children.length; index += 1) {
    const node = children[index]!
    const position = node.position
    const startOffset = position?.start.offset
    const endOffset = position?.end.offset

    if (node.type === 'html') {
      const classes = parseBlockCommentClasses(node.value ?? '')
      if (classes) {
        pendingCssClasses = classes
        continue
      }
    }

    if (startOffset !== undefined && endOffset !== undefined) {
      if (index === 0) {
        const leading = source.slice(0, startOffset)
        for (let count = 0; count < countNewlines(leading); count += 1) {
          output.push(createEmptyParagraphBlock())
        }
      } else {
        const previous = children[index - 1]!
        const previousEnd = previous.position?.end.offset

        if (previousEnd !== undefined) {
          const gap = source.slice(previousEnd, startOffset)
          const extra = emptyParagraphsForBlockGap(
            previous.type,
            node.type,
            countNewlines(gap),
          )

          for (let count = 0; count < extra; count += 1) {
            output.push(createEmptyParagraphBlock())
          }
        }
      }
    }

    const blocks = parseMarkdownNode(node, resolveAssetUrl)

    if (pendingCssClasses && blocks.length > 0) {
      const first = blocks[0]!

      if (
        first.type === 'image' &&
        pendingCssClasses.includes('image-stretch')
      ) {
        first.data.stretched = true
        const remaining = pendingCssClasses.filter((c) => c !== 'image-stretch')
        first.cssClasses = remaining.length > 0 ? remaining : undefined
      } else {
        first.cssClasses = pendingCssClasses
      }

      pendingCssClasses = null
    }

    output.push(...blocks)
  }

  const last = children[children.length - 1]
  const lastEnd = last?.position?.end.offset

  if (lastEnd !== undefined && children.length > 0) {
    const trailing = source.slice(lastEnd)
    const extraTrail = Math.max(0, countNewlines(trailing) - 1)

    for (let count = 0; count < extraTrail; count += 1) {
      output.push(createEmptyParagraphBlock())
    }
  }

  return output
}

function parseTextNodeToHtml(
  value: string,
  options: InlineParseOptions,
): string {
  const emojiWrapped = options.wrapPlainEmoji
    ? renderPlainEmojiAsEditorHtml(value)
    : value

  return markdownNewlinesToEditorHtml(wrapHashtagsForEditorHtml(emojiWrapped))
}

function isBigEmojiOpeningHtmlNode(node: MarkdownNode): boolean {
  if (node.type !== 'html') {
    return false
  }

  const value = node.value ?? ''

  return (
    /<(b|span|strong)\b/i.test(value) &&
    /\binline-big-emoji\b/i.test(value) &&
    !/^\s*<\//.test(value)
  )
}

function isBigEmojiClosingHtmlNode(node: MarkdownNode): boolean {
  return (
    node.type === 'html' &&
    /^\s*<\/(b|span|strong)>\s*$/i.test(node.value ?? '')
  )
}

function parseInlineNodeToHtml(
  node: MarkdownNode,
  options: InlineParseOptions = defaultInlineParseOptions,
): string {
  switch (node.type) {
    case 'image':
      return ''
    case 'text':
      return parseTextNodeToHtml(node.value ?? '', options)
    case 'emphasis':
      return `<i>${parseInlineNodesToHtml(node.children, options)}</i>`
    case 'strong': {
      const content = parseInlineNodesToHtml(node.children, {
        wrapPlainEmoji: false,
      })

      return isBigEmojiContent(content)
        ? renderBigEmojiHtml(content, 'bigger')
        : `<b>${content}</b>`
    }
    case 'delete':
      return `<s>${parseInlineNodesToHtml(node.children, options)}</s>`
    case 'inlineCode':
      return `<code class="inline-code">${node.value ?? ''}</code>`
    case 'mark':
    case 'highlight': {
      const renderedContent = parseInlineNodesToHtml(node.children, {
        wrapPlainEmoji: false,
      })
      const { style, content } =
        parseInlineHighlightMarkdownPrefix(renderedContent)

      return renderInlineHighlightHtml(content, style)
    }
    case 'link':
      return `<a href="${node.url ?? ''}">${parseInlineNodesToHtml(node.children, options)}</a>`
    case 'break':
      return '<br>'
    case 'html':
      return node.value ?? ''
    default:
      return parseInlineNodesToHtml(node.children, options)
  }
}

function parseInlineNodesToHtml(
  children: MarkdownNode[] | undefined,
  options: InlineParseOptions = defaultInlineParseOptions,
): string {
  const nodes = children ?? []
  const html: string[] = []

  for (let index = 0; index < nodes.length; index += 1) {
    const child = nodes[index]!

    if (isBigEmojiOpeningHtmlNode(child)) {
      const parts = [child.value ?? '']

      while (index + 1 < nodes.length) {
        index += 1
        const next = nodes[index]!

        if (next.type === 'text') {
          parts.push(next.value ?? '')
          continue
        }

        parts.push(parseInlineNodeToHtml(next, { wrapPlainEmoji: false }))

        if (isBigEmojiClosingHtmlNode(next)) {
          break
        }
      }

      html.push(parts.join(''))
      continue
    }

    html.push(parseInlineNodeToHtml(child, options))
  }

  return html.join('')
}

function parseHeading(node: MarkdownNode): EditorjsBlock {
  const level = Math.min(Math.max(node.depth ?? 1, 1), 6)
  const text = parseInlineNodesToHtml(node.children)

  return {
    type: 'header',
    data: {
      level,
      text,
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

function parseParagraph(
  node: MarkdownNode,
  resolveAssetUrl: AssetUrlResolver | undefined,
): EditorjsBlock[] {
  const assetUrlResolver = resolveAssetUrl ?? identityAssetUrl
  const children = node.children ?? []

  if (children.length === 1 && children[0]!.type === 'image') {
    const image = children[0]!
    const rawUrl = String(image.url ?? '')
    const caption = String(image.alt ?? '')

    return [
      {
        type: 'image',
        data: {
          file: {
            url: editorDisplayUrlForMarkdownImage(rawUrl, assetUrlResolver),
          },
          caption,
          withBorder: false,
          withBackground: false,
          stretched: false,
        },
      },
    ]
  }

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

function parseMarkdownNode(
  node: MarkdownNode,
  resolveAssetUrl: AssetUrlResolver | undefined,
): EditorjsBlock[] {
  switch (node.type) {
    case 'heading':
      return [parseHeading(node)]
    case 'paragraph':
      return parseParagraph(node, resolveAssetUrl)
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

export function markdownToEditorjsBlocks(
  markdown: string,
  resolveAssetUrl?: AssetUrlResolver,
): EditorjsBlock[] {
  if (markdown.length === 0) {
    return []
  }

  const normalizedMarkdown = transformProseOutsideFencedCodeBlocks(
    markdown,
    normalizeMarkdownProse,
  )
  const editorPreparedMarkdown = transformProseOutsideFencedCodeBlocks(
    normalizedMarkdown,
    renderBigEmojiMarkdownAsEditorHtml,
  )
  const parsedMarkdown = parseMarkdown(editorPreparedMarkdown)
  const children = parsedMarkdown.children ?? []

  if (children.length === 0) {
    if (!/\S/u.test(editorPreparedMarkdown)) {
      const blankLines = countNewlines(editorPreparedMarkdown)
      if (blankLines > 0) {
        return Array.from({ length: blankLines }, createEmptyParagraphBlock)
      }
    }

    return []
  }

  return blocksFromRootWithBlankLines(
    editorPreparedMarkdown,
    parsedMarkdown,
    resolveAssetUrl,
  )
}
