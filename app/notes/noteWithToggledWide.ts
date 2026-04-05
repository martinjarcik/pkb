import type { Note } from './types'

export function noteWithToggledWide(note: Note): Note {
  const next = { ...note }

  if (note.wide === true) {
    delete next.wide
  } else {
    next.wide = true
  }

  return next
}
