// Keep this hashtag matcher aligned with the editor-side wrappers in
// `app/lib/markdownToBlocks.ts` and `app/lib/editorjsHashtagHighlight.ts`.
export function extractTagsFromMarkdown(markdown: string): string[] {
  const tagSet = new Set<string>()

  for (const line of markdown.split('\n')) {
    const searchLine = line.replace(/^#{1,6}\s+.*/u, '')
    const matches = searchLine.matchAll(/(^|\s)#([^\s#]+)/gu)

    for (const match of matches) {
      const rawTag = match[2]?.trim().toLowerCase()

      if (!rawTag) {
        continue
      }

      tagSet.add(rawTag)
    }
  }

  return [...tagSet].sort((left, right) => left.localeCompare(right))
}
