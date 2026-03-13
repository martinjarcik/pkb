import type { Note } from "~/notes/types"

export interface NoteStorage {
  loadNotes(): Promise<Note[]>
  saveNote(note: Note): Promise<void>
  deleteNote(id: string): Promise<void>
}