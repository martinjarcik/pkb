import { truncateUtf8ByteLength } from '~/storage/document'
import {
  NOTE_CATALOG_CONTENT_BYTES,
  type Note,
  type NoteCatalogRow,
} from './types'

export function createNoteCatalogRow(note: Note): NoteCatalogRow {
  return {
    ...note,
    content: truncateUtf8ByteLength(note.content, NOTE_CATALOG_CONTENT_BYTES),
  }
}
