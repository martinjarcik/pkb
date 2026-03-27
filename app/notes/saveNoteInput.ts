import type { SaveNoteInput } from '~/storage/types'
import { sanitizeProperties } from '~/storage/document'
import { detectHasTasks } from './detectHasTasks'
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

export function buildSaveNoteInput(note: Note, content: string): SaveNoteInput {
  const properties = sanitizeProperties(note)

  return {
    id: note.id,
    properties: {
      ...properties,
      hasTasks: detectHasTasks(content),
      tags: mergeTags(existingTags(note), extractTagsFromMarkdown(content)),
    },
    content,
  }
}
