import type { Note, NoteProperties } from '~/notes/types'

export type SaveNoteInput = {
  id: string
  properties: NoteProperties
  content: string
}

export type RenameNoteTitleInput = {
  id: string
  title: string
  existingIds?: string[]
}

export type MoveNoteInput = {
  id: string
  targetParentPath: string
  existingIds?: string[]
}

export type NoteStorage = {
  loadAllNotes(): Promise<Note[]>
  saveNote(input: SaveNoteInput): Promise<Note>
  renameNoteTitle(input: RenameNoteTitleInput): Promise<Note>
  moveNote(input: MoveNoteInput): Promise<Note>
  softDeleteNote(id: string): Promise<Note>
  deleteNote(id: string): Promise<void>
  createFolder(name: string): Promise<void>
  renameFolder(oldName: string, newName: string): Promise<void>
}
