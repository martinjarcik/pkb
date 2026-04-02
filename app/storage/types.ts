import type { Note, NoteCatalogRow, NoteProperties } from '~/notes/types'

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
  loadNotesCatalog(): Promise<NoteCatalogRow[]>
  loadFolders(): Promise<string[]>
  loadNoteById(id: string): Promise<Note | null>
  saveNote(input: SaveNoteInput): Promise<Note>
  renameNoteTitle(input: RenameNoteTitleInput): Promise<Note>
  moveNote(input: MoveNoteInput): Promise<Note>
  softDeleteNote(id: string): Promise<Note>
  purgeExpiredTrashedNotes(retentionDays: number, now?: Date): Promise<void>
  deleteNote(id: string): Promise<void>
  createFolder(name: string): Promise<void>
  renameFolder(oldName: string, newName: string): Promise<void>
}
