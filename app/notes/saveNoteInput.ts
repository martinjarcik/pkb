import type { SaveNoteInput } from '~/storage/types'
import { sanitizeProperties } from '~/storage/document'
import { extractTagsFromMarkdown } from './extractTags'
import type { Note } from './types'

function existingTags(note: Note): string[] {
  if (!Array.isArray(note.tags)) {
    return []
  }

  return note.tags.filter((tag): tag is string => typeof tag === 'string')
}

function mergeTags(existing: string[], extracted: string[]): string[] {
  return [...new Set([...existing, ...extracted])].sort((left, right) =>
    left.localeCompare(right),
  )
}

export function normalizeSaveProperties(
  properties: unknown,
  content: string,
): SaveNoteInput['properties'] {
  const sanitizedProperties = sanitizeProperties(properties)
  const existing =
    Array.isArray(sanitizedProperties.tags) &&
    sanitizedProperties.tags.every((tag) => typeof tag === 'string')
      ? sanitizedProperties.tags
      : []

  return {
    ...sanitizedProperties,
    tags: mergeTags(existing, extractTagsFromMarkdown(content)),
  }
}

export function buildSaveNoteInput(note: Note, content: string): SaveNoteInput {
  return {
    id: note.id,
    properties: normalizeSaveProperties(
      {
        ...note,
        tags: existingTags(note),
      },
      content,
    ),
    content,
  }
}
