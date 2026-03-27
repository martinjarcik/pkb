import type { Note } from './types'

export function noteWithWebhookUrl(note: Note, url: string): Note {
  const next = { ...note }
  const trimmed = url.trim()

  if (trimmed.length === 0) {
    delete next.webhook
  } else {
    next.webhook = trimmed
  }

  return next
}
