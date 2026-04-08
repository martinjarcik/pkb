import {
  normalizeSavedEditorjsBlocks as normalizeSavedEditorjsBlocksWithBackground,
  prepareEditorjsBlocksForEditor as prepareEditorjsBlocksWithBackground,
} from './editorjsBlockBackground'
import {
  normalizeSavedEditorjsBlocksWithSizes,
  prepareEditorjsBlocksWithSizesForEditor,
} from './editorjsBlockSize'
import type { EditorjsBlock } from './editorjsMarkdownTypes'

export function prepareEditorjsBlocksForEditor(
  blocks: EditorjsBlock[],
): EditorjsBlock[] {
  return prepareEditorjsBlocksWithSizesForEditor(
    prepareEditorjsBlocksWithBackground(blocks),
  )
}

export function normalizeSavedEditorjsBlocks(
  blocks: EditorjsBlock[],
): EditorjsBlock[] {
  return normalizeSavedEditorjsBlocksWithSizes(
    normalizeSavedEditorjsBlocksWithBackground(blocks),
  )
}
