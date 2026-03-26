import { truncateUtf8ByteLength } from '~/storage/document'
import { noteDescriptionFromContent } from './noteDescriptionFromContent'
import { noteTitleFromId } from './noteTitleFromId'
import {
  NOTE_CATALOG_CONTENT_BYTES,
  type Note,
  type NoteCatalogRow,
  type NoteProperties,
} from './types'

type NoteCatalogRowParts = NoteProperties & {
  id: string
  content: string
  createdAt: string
  modifiedAt: string
}

export function createNoteCatalogRow(note: Note): NoteCatalogRow {
  return {
    ...note,
    content: truncateUtf8ByteLength(note.content, NOTE_CATALOG_CONTENT_BYTES),
    title: note.title,
    description: note.description,
  }
}

export function createNoteCatalogRowFromParts(
  note: NoteCatalogRowParts,
): NoteCatalogRow {
  const content = truncateUtf8ByteLength(
    note.content,
    NOTE_CATALOG_CONTENT_BYTES,
  )

  return {
    ...note,
    content,
    title: noteTitleFromId(note.id),
    description: noteDescriptionFromContent(note.content),
  }
}
