import { noteTitleFromId } from './noteTitleFromId'

export class InvalidNoteTitleError extends Error {
  constructor() {
    super('Note title must contain at least one valid filename character')
    this.name = 'InvalidNoteTitleError'
  }
}

export function splitNoteId(id: string): {
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

export function resolveUniqueNoteIdForParentPath(
  parentPath: string,
  title: string,
  existingIds: Iterable<string>,
): string {
  const sanitizedTitle = sanitizeNoteTitleForFilename(title)

  if (sanitizedTitle.length === 0) {
    throw new InvalidNoteTitleError()
  }

  const ids = new Set(existingIds)
  const nextId = buildNoteId(parentPath, `${sanitizedTitle}.md`)

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

export function createNoteIdFromTitle(
  currentId: string,
  title: string,
): string {
  const sanitizedTitle = sanitizeNoteTitleForFilename(title)

  if (sanitizedTitle.length === 0) {
    throw new InvalidNoteTitleError()
  }

  const { parentPath } = splitNoteId(currentId)

  return buildNoteId(parentPath, `${sanitizedTitle}.md`)
}

export function resolveUniqueNoteId(
  currentId: string,
  title: string,
  existingIds: Iterable<string>,
): string {
  const { parentPath } = splitNoteId(currentId)
  const ids = new Set(existingIds)

  ids.delete(currentId)

  return resolveUniqueNoteIdForParentPath(parentPath, title, ids)
}

export function moveNoteId(
  currentId: string,
  targetParentPath: string,
  existingIds: Iterable<string>,
): string {
  const { parentPath } = splitNoteId(currentId)

  if (parentPath === targetParentPath) {
    return currentId
  }

  const ids = new Set(existingIds)

  ids.delete(currentId)

  return resolveUniqueNoteIdForParentPath(
    targetParentPath,
    noteTitleFromId(currentId),
    ids,
  )
}
