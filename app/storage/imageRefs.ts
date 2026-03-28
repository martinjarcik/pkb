const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)]+)\)/g

export function extractLocalImageRefs(markdown: string): Set<string> {
  const refs = new Set<string>()

  for (const match of markdown.matchAll(MARKDOWN_IMAGE_PATTERN)) {
    const url = match[1]

    if (
      url &&
      !url.startsWith('http://') &&
      !url.startsWith('https://') &&
      !url.startsWith('data:')
    ) {
      refs.add(url)
    }
  }

  return refs
}

export function orphanedImageRefs(
  oldContent: string,
  newContent: string,
): string[] {
  const oldRefs = extractLocalImageRefs(oldContent)
  const newRefs = extractLocalImageRefs(newContent)

  return [...oldRefs].filter((ref) => !newRefs.has(ref))
}
