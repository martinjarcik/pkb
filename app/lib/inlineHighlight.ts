import { getDefaultEditorColor, getEditorColors } from './editorColors'

// This file is a conversion hotspot for inline highlight syntax shared by the
// markdown parser, serializer, and Editor.js tool.
export const INLINE_HIGHLIGHT_CLASS = 'inline-highlight'
export type InlineHighlightColor = string

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
  return value in getEditorColors()
}

export function getInlineHighlightDefaultColor(): InlineHighlightColor {
  return getDefaultEditorColor()
}

export function normalizeInlineHighlightColor(
  value: string | null | undefined,
): InlineHighlightColor {
  if (value && isInlineHighlightColor(value)) {
    return value
  }

  return getInlineHighlightDefaultColor()
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
    if (bgColor === getInlineHighlightDefaultColor()) {
      return ''
    }

    const emoji = getEditorColors()[bgColor]!.emoji
    return `${emoji}${emoji}`
  }

  if (textColor && !bgColor) {
    return getEditorColors()[textColor]!.emoji
  }

  const bgEmoji = getEditorColors()[bgColor!]!.emoji
  const textEmoji = getEditorColors()[textColor!]!.emoji
  return `${bgEmoji}${bgEmoji}${textEmoji}`
}

export function parseInlineHighlightMarkdownPrefix(text: string): {
  style: InlineHighlightStyle
  content: string
} {
  for (const [color, meta] of Object.entries(getEditorColors())) {
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

  for (const [bgColor, bgMeta] of Object.entries(getEditorColors())) {
    const doublePrefix = `${bgMeta.emoji}${bgMeta.emoji}`
    if (!text.startsWith(doublePrefix)) {
      continue
    }

    const afterDouble = text.slice(doublePrefix.length)

    for (const [textColor, textMeta] of Object.entries(getEditorColors())) {
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

  for (const [color, meta] of Object.entries(getEditorColors())) {
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
      bgColor: getInlineHighlightDefaultColor(),
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
      `background-color: ${escapeHtmlAttribute(getEditorColors()[bgColor]!.background)}`,
    )
  }

  if (textColor) {
    styleParts.push(
      `color: ${escapeHtmlAttribute(getEditorColors()[textColor]!.text)}`,
    )
  }

  const dataBg = bgColor ? ` data-bg="${bgColor}"` : ''
  const dataText = textColor ? ` data-text="${textColor}"` : ''
  const styleAttr =
    styleParts.length > 0 ? ` style="${styleParts.join('; ')}"` : ''

  return `<mark class="${INLINE_HIGHLIGHT_CLASS}"${dataBg}${dataText}${styleAttr}>${content}</mark>`
}
