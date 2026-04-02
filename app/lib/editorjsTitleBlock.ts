import type { EditorjsBlock } from './editorjsMarkdownTypes'

export function createNoteTitleBlock(title: string): EditorjsBlock {
  return {
    type: 'noteTitle',
    data: {
      text: title,
    },
  }
}

export function isNoteTitleBlock(block: EditorjsBlock): boolean {
  return block.type === 'noteTitle'
}

export function ensureNoteTitleBlock(
  blocks: EditorjsBlock[],
  fallbackTitle: string,
): EditorjsBlock[] {
  const titleBlock =
    blocks.find(isNoteTitleBlock) ?? createNoteTitleBlock(fallbackTitle)
  const otherBlocks = blocks.filter((block) => !isNoteTitleBlock(block))

  return [titleBlock, ...otherBlocks]
}

export function renderNoteTitleBlocks(
  blocks: EditorjsBlock[],
  title: string,
): EditorjsBlock[] {
  const otherBlocks = blocks.filter((block) => !isNoteTitleBlock(block))

  return [createNoteTitleBlock(title), ...otherBlocks]
}

export function extractNoteTitleText(blocks: EditorjsBlock[]): string {
  const titleBlock = blocks.find(isNoteTitleBlock)
  const raw = String(titleBlock?.data?.text ?? '')

  return raw.replace(/<[^>]+>/g, '').trim()
}

export function blocksMatch(a: EditorjsBlock[], b: EditorjsBlock[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
