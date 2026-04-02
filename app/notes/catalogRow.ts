import type { Note, NoteCatalogRow } from './types'

export function createNoteCatalogRow(note: Note): NoteCatalogRow {
  const { content: _content, ...catalogRow } = note

  return {
    ...catalogRow,
  }
}
