import type { Note } from '~/notes/types'

export type NoteStorage = {
  loadNotes(): Promise<Note[]>
  saveNote(note: Note): Promise<void>
  deleteNote(id: string): Promise<void>
}
