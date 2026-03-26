function stripMarkdownSyntax(line: string): string {
  return line
    .replace(/^>\s?/, '')
    .replace(/^[-*+]\s+\[(?: |x|X)\]\s+/, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\\([[\]`*_{}()#+\-.!|>])/g, '$1')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isMarkdownTableSeparator(line: string): boolean {
  return line.includes('|') && /^[\s|:-]+$/.test(line) && line.includes('-')
}

const MAX_DESCRIPTION_LENGTH = 120

export function noteDescriptionFromContent(content: string): string {
  const previewLines: string[] = []
  let isInsideFencedCodeBlock = false

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (/^(```|~~~)/.test(trimmedLine)) {
      isInsideFencedCodeBlock = !isInsideFencedCodeBlock
      continue
    }

    if (
      trimmedLine.length === 0 ||
      isInsideFencedCodeBlock ||
      /^#{1,6}\s+/.test(trimmedLine) ||
      /^([-*_]\s*){3,}$/.test(trimmedLine) ||
      isMarkdownTableSeparator(trimmedLine)
    ) {
      continue
    }

    const sanitizedLine = stripMarkdownSyntax(trimmedLine)

    if (sanitizedLine.length === 0) {
      continue
    }

    previewLines.push(sanitizedLine)
  }

  const normalizedContent = previewLines.join(' ').replace(/\s+/g, ' ').trim()

  if (normalizedContent.length <= MAX_DESCRIPTION_LENGTH) {
    return normalizedContent
  }

  return `${normalizedContent.slice(0, MAX_DESCRIPTION_LENGTH - 3)}...`
}
