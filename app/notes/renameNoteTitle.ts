function splitNoteId(id: string): {
  parentPath: string
  normalizedId: string
} {
  const normalizedId = id.replace(/\\/g, '/')
  const slash = normalizedId.lastIndexOf('/')

  return {
    parentPath: slash === -1 ? '' : normalizedId.slice(0, slash),
    normalizedId,
  }
}

function isUnsafeFilenameCharacter(character: string): boolean {
  return '/\\:*?"<>|'.includes(character) || character.charCodeAt(0) < 32
}

export function sanitizeNoteTitleForFilename(title: string): string {
  return title
    .split('')
    .map((character) =>
      isUnsafeFilenameCharacter(character) ? ' ' : character,
    )
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[. ]+/, '')
    .replace(/[. ]+$/, '')
}

function buildNoteId(parentPath: string, filename: string): string {
  return parentPath ? `${parentPath}/${filename}` : filename
}

export function createNoteIdFromTitle(
  currentId: string,
  title: string,
): string {
  const sanitizedTitle = sanitizeNoteTitleForFilename(title)

  if (sanitizedTitle.length === 0) {
    throw new Error(
      'Note title must contain at least one valid filename character',
    )
  }

  const { parentPath } = splitNoteId(currentId)

  return buildNoteId(parentPath, `${sanitizedTitle}.md`)
}

export function resolveUniqueNoteId(
  currentId: string,
  title: string,
  existingIds: Iterable<string>,
): string {
  const nextId = createNoteIdFromTitle(currentId, title)
  const { parentPath } = splitNoteId(currentId)
  const sanitizedTitle = sanitizeNoteTitleForFilename(title)
  const ids = new Set(existingIds)

  ids.delete(currentId)

  if (!ids.has(nextId)) {
    return nextId
  }

  for (let duplicateIndex = 2; ; duplicateIndex += 1) {
    const candidateId = buildNoteId(
      parentPath,
      `${sanitizedTitle} (${duplicateIndex}).md`,
    )

    if (!ids.has(candidateId)) {
      return candidateId
    }
  }
}
