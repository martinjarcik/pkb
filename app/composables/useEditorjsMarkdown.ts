import {
  editorjsBlocksToMarkdown,
  markdownToEditorjsBlocks,
} from '~/lib/editorjsMarkdown'

export type { EditorjsBlock } from '~/lib/editorjsMarkdown'
export { editorjsBlocksToMarkdown, markdownToEditorjsBlocks }

export function useEditorjsMarkdown() {
  return {
    editorjsBlocksToMarkdown,
    markdownToEditorjsBlocks,
  }
}
