import {
  INLINE_HIGHLIGHT_DEFAULT_COLOR,
  inlineHighlightMarkdownPrefix,
  isInlineHighlightColor,
  type InlineHighlightStyle,
} from './inlineHighlight'

export function editorHtmlLineBreaksToMarkdownNewlines(text: string): string {
  return text.replace(/\u200B/g, '').replace(/<br\b[^>]*\/?>/gi, '\n')
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
