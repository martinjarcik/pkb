import type { Note } from '~/notes/types'

const WEBHOOK_REQUEST_TIMEOUT_MS = 8000

export type NoteWebhookEvent = 'updated' | 'deleted'

export function isAllowedWebhookUrl(url: string): boolean {
  const trimmed = url.trim()

  if (trimmed.length === 0) {
    return false
  }

  try {
    const parsed = new URL(trimmed)

    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export async function dispatchNoteWebhook(
  url: string,
  event: NoteWebhookEvent,
  note: Note,
): Promise<void> {
  if (!isAllowedWebhookUrl(url)) {
    return
  }

  try {
    await fetch(url.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event, note }),
      signal: AbortSignal.timeout(WEBHOOK_REQUEST_TIMEOUT_MS),
    })
  } catch {
    console.error('[pkb] note webhook delivery failed')
  }
}
