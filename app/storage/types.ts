import type { Note, NoteCatalogRow, NoteProperties } from '~/notes/types'

export type SaveNoteInput = {
  id: string
  properties: NoteProperties
  content: string
}

export type RenameNoteTitleInput = {
  id: string
  title: string
}

export type NoteStorage = {
  loadNotesCatalog(): Promise<NoteCatalogRow[]>
  loadNoteById(id: string): Promise<Note | null>
  saveNote(input: SaveNoteInput): Promise<Note>
  renameNoteTitle(input: RenameNoteTitleInput): Promise<Note>
  deleteNote(id: string): Promise<void>
}
