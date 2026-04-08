export const BIG_EMOJI_CLASS = 'inline-big-emoji'
export const BIG_EMOJI_BIG_SIZE = 'big'
export const BIG_EMOJI_BIG_CLASS = 'inline-big-emoji-big'
export const BIG_EMOJI_STICK_CLASS = 'inline-big-emoji-stick'
export const BIG_EMOJI_STICK_BLOCK_CLASS = 'block-big-emoji-stick'
export const BIG_EMOJI_BIG_MARKER = '\u2060'
export const BIG_EMOJI_STICK_MARKER = '\u2063'

export type BigEmojiSize = 'bigger' | 'big'

const BIG_EMOJI_CONTENT_PATTERN = String.raw`\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*`

const BIG_EMOJI_ONLY_PATTERN = new RegExp(`^${BIG_EMOJI_CONTENT_PATTERN}$`, 'u')
const ASTERISK_BIG_EMOJI_PATTERN = new RegExp(
  String.raw`\*\*(${BIG_EMOJI_CONTENT_PATTERN})\*\*`,
  'gu',
)
const UNDERSCORE_BIG_EMOJI_PATTERN = new RegExp(
  String.raw`__(${BIG_EMOJI_CONTENT_PATTERN})__`,
  'gu',
)

export function isBigEmojiContent(content: string): boolean {
  return BIG_EMOJI_ONLY_PATTERN.test(content)
}

export function hasBigEmojiBigMarker(content: string): boolean {
  return content.includes(BIG_EMOJI_BIG_MARKER)
}

export function stripBigEmojiBigMarker(content: string): string {
  return content.replaceAll(BIG_EMOJI_BIG_MARKER, '')
}

export function hasBigEmojiStickMarker(content: string): boolean {
  return content.includes(BIG_EMOJI_STICK_MARKER)
}

export function stripBigEmojiMarkers(content: string): string {
  return content
    .replaceAll(BIG_EMOJI_BIG_MARKER, '')
    .replaceAll(BIG_EMOJI_STICK_MARKER, '')
}

const PLAIN_BIG_EMOJI_MARKER_PATTERN = new RegExp(
  `(${BIG_EMOJI_CONTENT_PATTERN})${BIG_EMOJI_BIG_MARKER}`,
  'gu',
)

export function replacePlainBigEmojiMarkersWithMarkdown(text: string): string {
  return text.replace(PLAIN_BIG_EMOJI_MARKER_PATTERN, '__$1__')
}

export function renderBigEmojiHtml(
  emoji: string,
  size: BigEmojiSize = 'bigger',
): string {
  const sizeClass = size === BIG_EMOJI_BIG_SIZE ? ` ${BIG_EMOJI_BIG_CLASS}` : ''
  const sizeAttr =
    size === BIG_EMOJI_BIG_SIZE ? ` data-size="${BIG_EMOJI_BIG_SIZE}"` : ''
  const textContent =
    size === BIG_EMOJI_BIG_SIZE ? `${emoji}${BIG_EMOJI_BIG_MARKER}` : emoji
  return `<b class="${BIG_EMOJI_CLASS}${sizeClass}" contenteditable="false"${sizeAttr}>${textContent}</b>`
}

export function renderBigEmojiMarkdownAsEditorHtml(markdown: string): string {
  return markdown
    .replace(UNDERSCORE_BIG_EMOJI_PATTERN, (_match, emoji) =>
      renderBigEmojiHtml(emoji, 'big'),
    )
    .replace(ASTERISK_BIG_EMOJI_PATTERN, (_match, emoji) =>
      renderBigEmojiHtml(emoji, 'bigger'),
    )
}

function splitBigEmojiClasses(classValue: string): string[] {
  return classValue.split(/\s+/).filter((token) => token.length > 0)
}

export function hasStickBigEmojiBlockClass(
  cssClasses: string[] | undefined,
): boolean {
  return (cssClasses ?? []).includes(BIG_EMOJI_STICK_BLOCK_CLASS)
}

export function mergeStickBigEmojiBlockClass(
  cssClasses: string[] | undefined,
  enabled: boolean,
): string[] | undefined {
  const nextClasses = (cssClasses ?? []).filter(
    (className) => className !== BIG_EMOJI_STICK_BLOCK_CLASS,
  )

  if (enabled) {
    nextClasses.push(BIG_EMOJI_STICK_BLOCK_CLASS)
  }

  return nextClasses.length > 0 ? nextClasses : undefined
}

export function decorateFirstBigEmojiHtmlAsStick(text: string): string {
  return text.replace(
    /<(b|span|strong)\b([^>]*)class=(["'])([^"']*\binline-big-emoji\b[^"']*)\3([^>]*)>([\s\S]*?)<\/\1>/i,
    (match, tag, beforeClass, quote, classValue, afterClass, content) => {
      const classTokens = splitBigEmojiClasses(classValue)

      if (!classTokens.includes(BIG_EMOJI_STICK_CLASS)) {
        classTokens.push(BIG_EMOJI_STICK_CLASS)
      }

      const stickAttr = /\bdata-stick=(["'])true\1/i.test(
        `${beforeClass}${afterClass}`,
      )
        ? ''
        : ' data-stick="true"'

      return `<${tag}${beforeClass}class=${quote}${classTokens.join(' ')}${quote}${afterClass}${stickAttr}>${content}</${tag}>`
    },
  )
}

export function hasStickBigEmojiHtml(text: string): boolean {
  return (
    text.includes(BIG_EMOJI_STICK_MARKER) ||
    /\bdata-stick=(["'])true\1/i.test(text) ||
    /\binline-big-emoji-stick\b/.test(text)
  )
}
