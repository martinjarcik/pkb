import {
  hasBigEmojiBigMarker,
  hasBigEmojiStickMarker,
  isBigEmojiContent,
  replacePlainBigEmojiMarkersWithMarkdown,
  stripBigEmojiMarkers,
} from './bigEmoji'
import {
  getInlineHighlightDefaultColor,
  inlineHighlightMarkdownPrefix,
  isInlineHighlightColor,
  type InlineHighlightStyle,
} from './inlineHighlight'

// This file is a conversion hotspot for Editor.js inline HTML. Prefer small,
// local extractions when changing one replacement rule.
export function editorHtmlLineBreaksToMarkdownNewlines(text: string): string {
  return text.replace(/[\u200B\u200A]/g, '').replace(/<br\b[^>]*\/?>/gi, '\n')
}

function bigEmojiMarkdownWrapper(
  tag: string,
  attrs: string,
  content: string,
): '__' | '**' {
  const classValue = attrs.match(/\bclass=(["'])(.*?)\1/i)?.[2] ?? ''
  const classTokens = classValue
    .split(/\s+/)
    .filter((token) => token.length > 0)

  if (
    hasBigEmojiBigMarker(content) ||
    hasBigEmojiStickMarker(content) ||
    tag.toLowerCase() === 'strong' ||
    classTokens.includes('inline-big-emoji-big')
  ) {
    return '__'
  }

  return /\bdata-size=(["'])big\1/i.test(attrs) ? '__' : '**'
}

function isBigEmojiAttrs(attrs: string): boolean {
  const classValue = attrs.match(/\bclass=(["'])(.*?)\1/i)?.[2] ?? ''
  return classValue.split(/\s+/).includes('inline-big-emoji')
}

function isWrappedBigEmojiMarkdown(content: string): boolean {
  if (content.length < 5) {
    return false
  }

  if (
    (content.startsWith('**') && content.endsWith('**')) ||
    (content.startsWith('__') && content.endsWith('__'))
  ) {
    return isBigEmojiContent(content.slice(2, -2))
  }

  return false
}

function standaloneBigEmojiMarkdown(content: string): string | null {
  const normalizedContent = stripBigEmojiMarkers(content)
  if (!isBigEmojiContent(normalizedContent)) {
    return null
  }

  const wrapper = hasBigEmojiBigMarker(content) ? '__' : '**'
  return `${wrapper}${normalizedContent}${wrapper}`
}

export function inlineHtmlToMarkdown(text: string): string {
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
              : getInlineHighlightDefaultColor()
          style = { bgColor, textColor: null }
        } else {
          style = {
            bgColor: getInlineHighlightDefaultColor(),
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
      /<(b|strong)\b[^>]*>\s*<(span|strong|b)\b([^>]*)>([\s\S]*?)<\/\2>\s*<\/\1>/gi,
      (match, _outerTag, innerTag, innerAttrs, content) => {
        if (!isBigEmojiAttrs(innerAttrs)) {
          return match
        }

        const wrapper = bigEmojiMarkdownWrapper(innerTag, innerAttrs, content)
        const cleanContent = stripBigEmojiMarkers(content)
        return `${wrapper}${cleanContent}${wrapper}`
      },
    ],
    [
      /<(span|strong|b)\b([^>]*)>([\s\S]*?)<\/\1>(?=<(?:span|strong|b)\b)/gi,
      (match, tag, attrs, content) => {
        if (!isBigEmojiAttrs(attrs)) {
          return match
        }

        const wrapper = bigEmojiMarkdownWrapper(tag, attrs, content)
        const cleanContent = stripBigEmojiMarkers(content)
        return `${wrapper}${cleanContent}${wrapper}\u200C`
      },
    ],
    [
      /<(span|strong|b)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
      (match, tag, attrs, content) => {
        if (!isBigEmojiAttrs(attrs)) {
          return match
        }

        const wrapper = bigEmojiMarkdownWrapper(tag, attrs, content)
        const cleanContent = stripBigEmojiMarkers(content)
        return `${wrapper}${cleanContent}${wrapper}`
      },
    ],
    [
      /<(i|em)\b[^>]*>([\s\S]*?)<\/\1>/gi,
      (_match, _tag, content) => `*${content}*`,
    ],
    [
      /<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi,
      (_match, _tag, content) => {
        if (isWrappedBigEmojiMarkdown(content)) {
          return content
        }

        const bigEmojiMarkdown = standaloneBigEmojiMarkdown(content)
        if (bigEmojiMarkdown) {
          return bigEmojiMarkdown
        }

        return `**${content}**`
      },
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

  return replacePlainBigEmojiMarkersWithMarkdown(normalized)
}
