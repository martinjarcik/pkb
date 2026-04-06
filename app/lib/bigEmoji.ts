export const BIG_EMOJI_CLASS = 'inline-big-emoji'
export const BIG_EMOJI_BIG_SIZE = 'big'
export const BIG_EMOJI_BIG_CLASS = 'inline-big-emoji-big'
export const BIG_EMOJI_BIG_MARKER = '\u2060'

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
