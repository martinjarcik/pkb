import {
  normalizeSavedEditorjsBlocks as normalizeSavedEditorjsBlocksWithBackground,
  prepareEditorjsBlocksForEditor as prepareEditorjsBlocksWithBackground,
} from './editorjsBlockBackground'
import {
  decorateFirstBigEmojiHtmlAsStick,
  hasStickBigEmojiBlockClass,
  hasStickBigEmojiHtml,
  mergeStickBigEmojiBlockClass,
} from './bigEmoji'
import {
  normalizeSavedEditorjsBlocksWithSizes,
  prepareEditorjsBlocksWithSizesForEditor,
} from './editorjsBlockSize'
import type { EditorjsBlock } from './editorjsMarkdownTypes'

function prepareEditorjsBlocksWithStickBigEmoji(
  blocks: EditorjsBlock[],
): EditorjsBlock[] {
  return blocks.map((block) => {
    const text = typeof block.data.text === 'string' ? block.data.text : null

    if (!text || !hasStickBigEmojiBlockClass(block.cssClasses)) {
      return block
    }

    return {
      ...block,
      data: {
        ...block.data,
        text: decorateFirstBigEmojiHtmlAsStick(text),
      },
    }
  })
}

function normalizeSavedEditorjsBlocksWithStickBigEmoji(
  blocks: EditorjsBlock[],
): EditorjsBlock[] {
  return blocks.map((block) => {
    const text = typeof block.data.text === 'string' ? block.data.text : ''

    return {
      ...block,
      cssClasses: mergeStickBigEmojiBlockClass(
        block.cssClasses,
        hasStickBigEmojiHtml(text),
      ),
    }
  })
}

export function prepareEditorjsBlocksForEditor(
  blocks: EditorjsBlock[],
): EditorjsBlock[] {
  return prepareEditorjsBlocksWithStickBigEmoji(
    prepareEditorjsBlocksWithSizesForEditor(
      prepareEditorjsBlocksWithBackground(blocks),
    ),
  )
}

export function normalizeSavedEditorjsBlocks(
  blocks: EditorjsBlock[],
): EditorjsBlock[] {
  return normalizeSavedEditorjsBlocksWithStickBigEmoji(
    normalizeSavedEditorjsBlocksWithSizes(
      normalizeSavedEditorjsBlocksWithBackground(blocks),
    ),
  )
}
