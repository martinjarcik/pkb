// Keep this hashtag matcher aligned with the editor-side wrappers in
// `app/lib/markdownToBlocks.ts` and `app/lib/editorjsHashtagHighlight.ts`.
const HASHTAG_PATTERN_SOURCE = '(^|\\s)(#[^\\s#]+)'

export function createHashtagPattern(): RegExp {
  return new RegExp(HASHTAG_PATTERN_SOURCE, 'gu')
}

export function extractTagsFromMarkdown(markdown: string): string[] {
  const tagSet = new Set<string>()

  for (const line of markdown.split('\n')) {
    const searchLine = line.replace(/^#{1,6}\s+.*/u, '')
    const matches = searchLine.matchAll(createHashtagPattern())

    for (const match of matches) {
      const rawTag = match[2]?.trim().slice(1).toLowerCase()

      if (!rawTag) {
        continue
      }

      tagSet.add(rawTag)
    }
  }

  return [...tagSet].sort((left, right) => left.localeCompare(right))
}
