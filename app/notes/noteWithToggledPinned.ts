import type { Note } from './types'

export function noteWithToggledPinned(note: Note): Note {
  const next = { ...note }

  if (note.pinned === true) {
    delete next.pinned
  } else {
    next.pinned = true
  }

  return next
}
