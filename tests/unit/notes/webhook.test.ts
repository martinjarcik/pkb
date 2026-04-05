import { afterEach, describe, expect, it, vi } from 'vitest'
import { dispatchNoteWebhook } from '~/notes/webhook'
import type { Note } from '~/notes/types'

const note: Note = {
  id: 'note.md',
  content: 'Hello',
  createdAt: '2026-04-01T00:00:00.000Z',
  modifiedAt: '2026-04-02T00:00:00.000Z',
  title: 'note',
  description: 'Hello',
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('dispatchNoteWebhook', () => {
  it('skips non-https urls', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await dispatchNoteWebhook('http://example.com/hook', 'updated', note)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts the note payload to https urls', async () => {
    const fetchMock = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('fetch', fetchMock)

    await dispatchNoteWebhook('https://example.com/hook', 'deleted', note)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/hook',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ event: 'deleted', note }),
      }),
    )
  })

  it('swallows delivery errors', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('boom'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      dispatchNoteWebhook('https://example.com/hook', 'updated', note),
    ).resolves.toBeUndefined()

    expect(consoleError).toHaveBeenCalledWith(
      '[pkb] note webhook delivery failed',
    )
  })
})
