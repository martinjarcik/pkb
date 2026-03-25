import type { SaveNoteInput } from '~/storage/types'
import { sanitizeProperties } from '~/storage/document'
import type { Note } from './types'

export function buildSaveNoteInput(note: Note, content: string): SaveNoteInput {
  return {
    id: note.id,
    properties: sanitizeProperties(note),
    content,
  }
}
