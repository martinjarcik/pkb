export const BIG_EMOJI_CLASS = 'inline-big-emoji'

const BIG_EMOJI_ONLY_PATTERN =
  /^\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*$/u

export function isBigEmojiContent(content: string): boolean {
  return BIG_EMOJI_ONLY_PATTERN.test(content)
}

export function renderBigEmojiHtml(emoji: string): string {
  return `<strong class="${BIG_EMOJI_CLASS}">${emoji}</strong>`
}
