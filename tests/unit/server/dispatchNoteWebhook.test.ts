import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  dispatchNoteWebhook,
  isAllowedWebhookUrl,
} from '../../../server/dispatchNoteWebhook'
import type { Note } from '~/notes/types'

function minimalNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'a.md',
    content: 'x',
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    title: 'a',
    description: '',
    ...overrides,
  }
}

describe('isAllowedWebhookUrl', () => {
  it('accepts https URLs', () => {
    expect(isAllowedWebhookUrl('https://example.com/hook')).toBe(true)
  })

  it('rejects http URLs', () => {
    expect(isAllowedWebhookUrl('http://example.com/hook')).toBe(false)
  })

  it('rejects non-http schemes', () => {
    expect(isAllowedWebhookUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects ftp URLs', () => {
    expect(isAllowedWebhookUrl('ftp://example.com/')).toBe(false)
  })

  it('rejects empty or whitespace only', () => {
    expect(isAllowedWebhookUrl('')).toBe(false)
  })

  it('rejects whitespace-only strings', () => {
    expect(isAllowedWebhookUrl('   ')).toBe(false)
  })
})

describe('dispatchNoteWebhook', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('does not fetch when URL is not HTTPS', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await dispatchNoteWebhook('http://example.com/h', 'updated', minimalNote())

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('POSTs to the provided webhook URL once', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response())
    vi.stubGlobal('fetch', fetchMock)

    const note = minimalNote({ id: 'n.md', webhook: 'https://hooks.example/x' })

    await dispatchNoteWebhook('https://hooks.example/x', 'deleted', note)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://hooks.example/x')
  })

  it('uses a JSON POST request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response())
    vi.stubGlobal('fetch', fetchMock)

    await dispatchNoteWebhook(
      'https://hooks.example/x',
      'deleted',
      minimalNote({ webhook: 'https://hooks.example/x' }),
    )

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('sends the event in the JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response())
    vi.stubGlobal('fetch', fetchMock)

    await dispatchNoteWebhook(
      'https://hooks.example/x',
      'deleted',
      minimalNote({ webhook: 'https://hooks.example/x' }),
    )

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
      event: string
      note: Note
    }

    expect(body.event).toBe('deleted')
  })

  it('sends the full note in the JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response())
    vi.stubGlobal('fetch', fetchMock)

    const note = minimalNote({ id: 'n.md', webhook: 'https://hooks.example/x' })

    await dispatchNoteWebhook('https://hooks.example/x', 'deleted', note)

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
      event: string
      note: Note
    }

    expect(body.note).toEqual(note)
  })
})
