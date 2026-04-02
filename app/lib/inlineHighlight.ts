import { DEFAULT_EDITOR_COLOR, EDITOR_COLORS } from './editorColors'

// This file is a conversion hotspot for inline highlight syntax shared by the
// markdown parser, serializer, and Editor.js tool.
export const INLINE_HIGHLIGHT_CLASS = 'inline-highlight'

export const INLINE_HIGHLIGHT_COLORS = EDITOR_COLORS
const INLINE_HIGHLIGHT_COLOR_NAMES = Object.keys(INLINE_HIGHLIGHT_COLORS)

export const INLINE_HIGHLIGHT_DEFAULT_COLOR = (
  INLINE_HIGHLIGHT_COLOR_NAMES.includes(DEFAULT_EDITOR_COLOR)
    ? DEFAULT_EDITOR_COLOR
    : INLINE_HIGHLIGHT_COLOR_NAMES[0]
) as InlineHighlightColor

export type InlineHighlightColor = keyof typeof INLINE_HIGHLIGHT_COLORS

export type InlineHighlightStyle = {
  textColor: InlineHighlightColor | null
  bgColor: InlineHighlightColor | null
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

/**
 * Markdown prefix encoding:
 * - no prefix     -> default background color only
 * - 1 emoji       -> text color only
 * - 2 same emojis -> background color only
 * - 3 emojis      -> first two = background, third = text (can differ)
 */
export function inlineHighlightMarkdownPrefix(
  style: InlineHighlightStyle,
): string {
  const { textColor, bgColor } = style

  if (!textColor && !bgColor) {
    return ''
  }

  if (!textColor && bgColor) {
    if (bgColor === INLINE_HIGHLIGHT_DEFAULT_COLOR) {
      return ''
    }

    const emoji = INLINE_HIGHLIGHT_COLORS[bgColor]!.emoji
    return `${emoji}${emoji}`
  }

  if (textColor && !bgColor) {
    return INLINE_HIGHLIGHT_COLORS[textColor]!.emoji
  }

  const bgEmoji = INLINE_HIGHLIGHT_COLORS[bgColor!]!.emoji
  const textEmoji = INLINE_HIGHLIGHT_COLORS[textColor!]!.emoji
  return `${bgEmoji}${bgEmoji}${textEmoji}`
}

export function parseInlineHighlightMarkdownPrefix(text: string): {
  style: InlineHighlightStyle
  content: string
} {
  for (const [color, meta] of Object.entries(INLINE_HIGHLIGHT_COLORS)) {
    const triplePrefix = `${meta.emoji}${meta.emoji}${meta.emoji}`
    if (text.startsWith(triplePrefix)) {
      return {
        style: {
          bgColor: color as InlineHighlightColor,
          textColor: color as InlineHighlightColor,
        },
        content: text.slice(triplePrefix.length),
      }
    }
  }

  for (const [bgColor, bgMeta] of Object.entries(INLINE_HIGHLIGHT_COLORS)) {
    const doublePrefix = `${bgMeta.emoji}${bgMeta.emoji}`
    if (!text.startsWith(doublePrefix)) {
      continue
    }

    const afterDouble = text.slice(doublePrefix.length)

    for (const [textColor, textMeta] of Object.entries(
      INLINE_HIGHLIGHT_COLORS,
    )) {
      if (afterDouble.startsWith(textMeta.emoji)) {
        return {
          style: {
            bgColor: bgColor as InlineHighlightColor,
            textColor: textColor as InlineHighlightColor,
          },
          content: afterDouble.slice(textMeta.emoji.length),
        }
      }
    }

    return {
      style: {
        bgColor: bgColor as InlineHighlightColor,
        textColor: null,
      },
      content: afterDouble,
    }
  }

  for (const [color, meta] of Object.entries(INLINE_HIGHLIGHT_COLORS)) {
    if (text.startsWith(meta.emoji)) {
      return {
        style: {
          textColor: color as InlineHighlightColor,
          bgColor: null,
        },
        content: text.slice(meta.emoji.length),
      }
    }
  }

  return {
    style: {
      bgColor: INLINE_HIGHLIGHT_DEFAULT_COLOR,
      textColor: null,
    },
    content: text,
  }
}

export function renderInlineHighlightHtml(
  content: string,
  style: InlineHighlightStyle,
): string {
  const bgColor = style.bgColor
  const textColor = style.textColor

  const styleParts: string[] = []

  if (bgColor) {
    styleParts.push(
      `background-color: ${escapeHtmlAttribute(INLINE_HIGHLIGHT_COLORS[bgColor]!.background)}`,
    )
  }

  if (textColor) {
    styleParts.push(
      `color: ${escapeHtmlAttribute(INLINE_HIGHLIGHT_COLORS[textColor]!.text)}`,
    )
  }

  const dataBg = bgColor ? ` data-bg="${bgColor}"` : ''
  const dataText = textColor ? ` data-text="${textColor}"` : ''
  const styleAttr =
    styleParts.length > 0 ? ` style="${styleParts.join('; ')}"` : ''

  return `<mark class="${INLINE_HIGHLIGHT_CLASS}"${dataBg}${dataText}${styleAttr}>${content}</mark>`
}
