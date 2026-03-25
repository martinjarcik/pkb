import type { Note, NoteProperties } from '~/notes/types'

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
  loadNotes(): Promise<Note[]>
  saveNote(input: SaveNoteInput): Promise<Note>
  renameNoteTitle(input: RenameNoteTitleInput): Promise<Note>
  deleteNote(id: string): Promise<void>
}
