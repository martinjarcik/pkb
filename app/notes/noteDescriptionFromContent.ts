import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import { remarkHighlightMark } from 'remark-highlight-mark'

const EMOJI_PATTERN =
  /[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?/gu
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>()]+/giu
const markdownParser = remark().use(remarkGfm).use(remarkHighlightMark)

type MarkdownNode = {
  type: string
  alt?: string | null
  value?: string
  children?: MarkdownNode[]
}

function collectNodeText(node: MarkdownNode, segments: string[]): void {
  if (
    node.type === 'heading' ||
    node.type === 'code' ||
    node.type === 'html' ||
    node.type === 'thematicBreak'
  ) {
    return
  }

  if (node.type === 'image') {
    if (typeof node.alt === 'string' && node.alt.trim().length > 0) {
      segments.push(node.alt)
    }
    return
  }

  if (node.type === 'inlineCode' || node.type === 'text') {
    if (typeof node.value === 'string' && node.value.trim().length > 0) {
      segments.push(node.value)
    }
    return
  }

  for (const child of node.children ?? []) {
    collectNodeText(child, segments)
  }
}

const MAX_DESCRIPTION_LENGTH = 120

export function noteDescriptionFromContent(content: string): string {
  const sanitizedContent = content.replace(
    /==(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?){0,3}(.*?)==/gu,
    '$1',
  )
  const tree = markdownParser.parse(sanitizedContent) as MarkdownNode
  const segments: string[] = []

  collectNodeText(tree, segments)

  const normalizedContent = segments
    .join(' ')
    .replace(URL_PATTERN, ' ')
    .replace(EMOJI_PATTERN, '')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  if (normalizedContent.length <= MAX_DESCRIPTION_LENGTH) {
    return normalizedContent
  }

  return `${normalizedContent.slice(0, MAX_DESCRIPTION_LENGTH - 3)}...`
}
