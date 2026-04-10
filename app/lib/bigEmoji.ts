export const BIG_EMOJI_CLASS = 'inline-big-emoji'
export const BIG_EMOJI_DEFAULT_SIZE = 'default'
export const BIG_EMOJI_BIGGER_SIZE = 'bigger'
export const BIG_EMOJI_BIG_SIZE = 'big'
export const BIG_EMOJI_BIGGER_CLASS = 'inline-big-emoji-bigger'
export const BIG_EMOJI_BIG_CLASS = 'inline-big-emoji-big'
export const BIG_EMOJI_STICK_CLASS = 'inline-big-emoji-stick'
export const BIG_EMOJI_STICK_BLOCK_CLASS = 'block-big-emoji-stick'
export const BIG_EMOJI_SELECTED_BLOCK_CLASS = 'block-big-emoji-selected'
export const BIG_EMOJI_DEFAULT_MARKER = '\u2062'
export const BIG_EMOJI_BIGGER_MARKER = '\u2064'
export const BIG_EMOJI_BIG_MARKER = '\u2060'
export const BIG_EMOJI_STICK_MARKER = '\u2063'

export type BigEmojiSize = 'default' | 'bigger' | 'big'

export const BIG_EMOJI_CONTENT_PATTERN = String.raw`\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*`

const BIG_EMOJI_ONLY_PATTERN = new RegExp(`^${BIG_EMOJI_CONTENT_PATTERN}$`, 'u')
const PLAIN_EMOJI_PATTERN = new RegExp(BIG_EMOJI_CONTENT_PATTERN, 'gu')
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

export function hasBigEmojiDefaultMarker(content: string): boolean {
  return content.includes(BIG_EMOJI_DEFAULT_MARKER)
}

export function hasBigEmojiBiggerMarker(content: string): boolean {
  return content.includes(BIG_EMOJI_BIGGER_MARKER)
}

export function stripBigEmojiBigMarker(content: string): string {
  return content.replaceAll(BIG_EMOJI_BIG_MARKER, '')
}

export function hasBigEmojiStickMarker(content: string): boolean {
  return content.includes(BIG_EMOJI_STICK_MARKER)
}

export function stripBigEmojiMarkers(content: string): string {
  return content
    .replaceAll(BIG_EMOJI_DEFAULT_MARKER, '')
    .replaceAll(BIG_EMOJI_BIGGER_MARKER, '')
    .replaceAll(BIG_EMOJI_BIG_MARKER, '')
    .replaceAll(BIG_EMOJI_STICK_MARKER, '')
}

export function replacePlainBigEmojiMarkersWithMarkdown(text: string): string {
  return text
    .replace(
      new RegExp(
        `(${BIG_EMOJI_CONTENT_PATTERN})${BIG_EMOJI_DEFAULT_MARKER}`,
        'gu',
      ),
      '$1',
    )
    .replace(
      new RegExp(
        `(${BIG_EMOJI_CONTENT_PATTERN})${BIG_EMOJI_BIGGER_MARKER}`,
        'gu',
      ),
      '**$1**',
    )
    .replace(
      new RegExp(`(${BIG_EMOJI_CONTENT_PATTERN})${BIG_EMOJI_BIG_MARKER}`, 'gu'),
      '__$1__',
    )
}

export function renderBigEmojiHtml(
  emoji: string,
  size: BigEmojiSize = BIG_EMOJI_DEFAULT_SIZE,
): string {
  const sizeClass =
    size === BIG_EMOJI_BIGGER_SIZE
      ? ` ${BIG_EMOJI_BIGGER_CLASS}`
      : size === BIG_EMOJI_BIG_SIZE
        ? ` ${BIG_EMOJI_BIG_CLASS}`
        : ''
  const sizeAttr = ` data-size="${size}"`
  const textContent =
    size === BIG_EMOJI_BIG_SIZE
      ? `${emoji}${BIG_EMOJI_BIG_MARKER}`
      : size === BIG_EMOJI_BIGGER_SIZE
        ? `${emoji}${BIG_EMOJI_BIGGER_MARKER}`
        : `${emoji}${BIG_EMOJI_DEFAULT_MARKER}`
  return `<b class="${BIG_EMOJI_CLASS}${sizeClass}" contenteditable="false"${sizeAttr}>${textContent}</b>`
}

export function renderPlainEmojiAsEditorHtml(text: string): string {
  return text.replace(PLAIN_EMOJI_PATTERN, (emoji) =>
    renderBigEmojiHtml(emoji, BIG_EMOJI_DEFAULT_SIZE),
  )
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
      const nextContent = hasBigEmojiStickMarker(content)
        ? content
        : `${content}${BIG_EMOJI_STICK_MARKER}`

      return `<${tag}${beforeClass}class=${quote}${classTokens.join(' ')}${quote}${afterClass}${stickAttr}>${nextContent}</${tag}>`
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
