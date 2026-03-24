declare module 'editorjs-md-parser' {
  export type EditorjsMarkdownBlock = {
    type: string
    data: Record<string, unknown>
  }

  const editorjsMarkdown: {
    MDImporter: unknown
    MDParser: unknown
    MDfromBlocks(blocks: EditorjsMarkdownBlock[]): Promise<string> | string
    MDtoBlocks(
      markdown: string,
    ): Promise<EditorjsMarkdownBlock[]> | EditorjsMarkdownBlock[]
  }

  export default editorjsMarkdown
}
