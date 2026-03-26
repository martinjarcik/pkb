import type { SaveNoteInput } from '~/storage/types'
import { sanitizeProperties } from '~/storage/document'
import { extractTagsFromMarkdown } from './extractTags'
import type { Note } from './types'

export function buildSaveNoteInput(note: Note, content: string): SaveNoteInput {
  const properties = sanitizeProperties(note)

  return {
    id: note.id,
    properties: {
      ...properties,
      tags: extractTagsFromMarkdown(content),
    },
    content,
  }
}
