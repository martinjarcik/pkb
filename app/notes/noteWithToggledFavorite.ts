import type { Note } from './types'

export function noteWithToggledFavorite(note: Note): Note {
  const next = { ...note }

  if (note.favorite === true) {
    delete next.favorite
  } else {
    next.favorite = true
  }

  return next
}
