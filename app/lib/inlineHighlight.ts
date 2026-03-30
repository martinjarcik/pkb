import { loadConfig } from '~/config/loader'

export const INLINE_HIGHLIGHT_CLASS = 'inline-highlight'

export const INLINE_HIGHLIGHT_COLORS = loadConfig().editorColors
const INLINE_HIGHLIGHT_COLOR_NAMES = Object.keys(INLINE_HIGHLIGHT_COLORS)

export const INLINE_HIGHLIGHT_DEFAULT_COLOR = (
  INLINE_HIGHLIGHT_COLOR_NAMES.includes('yellow')
    ? 'yellow'
    : INLINE_HIGHLIGHT_COLOR_NAMES[0]
) as keyof typeof INLINE_HIGHLIGHT_COLORS

export type InlineHighlightColor = keyof typeof INLINE_HIGHLIGHT_COLORS

function inlineHighlightBackground(color: InlineHighlightColor): string {
  return INLINE_HIGHLIGHT_COLORS[color]!.background
}

function escapeHtmlAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}

export function isInlineHighlightColor(
  value: string,
): value is InlineHighlightColor {
  return value in INLINE_HIGHLIGHT_COLORS
}

export function normalizeInlineHighlightColor(
  value: string | null | undefined,
): InlineHighlightColor {
  if (value && isInlineHighlightColor(value)) {
    return value
  }

  return INLINE_HIGHLIGHT_DEFAULT_COLOR
}

export function inlineHighlightMarkdownPrefix(
  color: InlineHighlightColor,
): string {
  if (color === INLINE_HIGHLIGHT_DEFAULT_COLOR) {
    return ''
  }

  return INLINE_HIGHLIGHT_COLORS[color]!.emoji
}

export function parseInlineHighlightMarkdownPrefix(text: string): {
  color: InlineHighlightColor
  content: string
} {
  for (const [color, meta] of Object.entries(INLINE_HIGHLIGHT_COLORS)) {
    if (text.startsWith(meta.emoji)) {
      return {
        color: color as InlineHighlightColor,
        content: text.slice(meta.emoji.length),
      }
    }
  }

  return {
    color: INLINE_HIGHLIGHT_DEFAULT_COLOR,
    content: text,
  }
}

export function renderInlineHighlightHtml(
  content: string,
  color: InlineHighlightColor,
): string {
  const background = escapeHtmlAttribute(inlineHighlightBackground(color))

  return `<mark class="${INLINE_HIGHLIGHT_CLASS}" data-color="${color}" style="background-color: ${background}">${content}</mark>`
}
