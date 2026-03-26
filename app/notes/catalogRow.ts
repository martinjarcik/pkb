import { truncateUtf8ByteLength } from '~/storage/document'
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
  return createNoteCatalogRowFromParts(note)
}

export function createNoteCatalogRowFromParts(
  note: NoteCatalogRowParts,
): NoteCatalogRow {
  return {
    ...note,
    content: truncateUtf8ByteLength(note.content, NOTE_CATALOG_CONTENT_BYTES),
  }
}
