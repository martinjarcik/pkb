import type { NoteStorage } from "./types"
import type { Note } from "~/notes/types"

const STORAGE_KEY = "notes"

export const browserStorage: NoteStorage = {
  async loadNotes(): Promise<Note[]> {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  },

  async saveNote(note: Note): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEY)
    const notes: Note[] = raw ? JSON.parse(raw) : []
    const next = [...notes.filter((n) => n.id !== note.id), note]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  },

  async deleteNote(id: string): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEY)
    const notes: Note[] = raw ? JSON.parse(raw) : []
    const next = notes.filter((n) => n.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  },
}