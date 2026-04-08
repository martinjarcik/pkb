import type { SaveNoteInput } from '~/storage/types'
import { sanitizeProperties } from '~/storage/document'
import type { Note } from './types'

export function normalizeSaveProperties(
  properties: unknown,
  _content: string,
): SaveNoteInput['properties'] {
  return sanitizeProperties(properties)
}

export function buildSaveNoteInput(note: Note, content: string): SaveNoteInput {
  return {
    id: note.id,
    properties: normalizeSaveProperties(note, content),
    content,
  }
}
