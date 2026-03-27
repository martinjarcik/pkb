import { describe, expect, it } from 'vitest'
import { noteWithWebhookUrl } from '~/notes/noteWithWebhookUrl'
import type { Note } from '~/notes/types'

function minimalNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'a.md',
    content: '',
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    title: 'a',
    description: '',
    ...overrides,
  }
}

describe('noteWithWebhookUrl', () => {
  it('sets webhook to trimmed string', () => {
    const next = noteWithWebhookUrl(
      minimalNote(),
      '  https://example.com/hook  ',
    )
    expect(next.webhook).toBe('https://example.com/hook')
  })

  it('removes webhook when url is empty after trim', () => {
    const next = noteWithWebhookUrl(
      minimalNote({ webhook: 'https://x.test/y' }),
      '   ',
    )
    expect(next.webhook).toBeUndefined()
  })

  it('removes webhook when url is empty string', () => {
    const next = noteWithWebhookUrl(
      minimalNote({ webhook: 'https://x.test/y' }),
      '',
    )
    expect(next.webhook).toBeUndefined()
  })
})
