import { describe, expect, it } from 'vitest'
import { parseDocument, serializeDocument } from '~/storage/document'

describe('serializeDocument', () => {
  it('nests application properties under the app key', () => {
    expect(
      serializeDocument(
        {
          favorite: true,
        },
        '# Hello',
      ),
    ).toBe('---\napp:\n  favorite: true\n---\n# Hello')
  })

  it('keeps user-defined properties at the top level', () => {
    expect(
      serializeDocument(
        {
          favorite: true,
          tags: ['cooking'],
        },
        '# Hello',
      ),
    ).toBe('---\ntags:\n  - cooking\napp:\n  favorite: true\n---\n# Hello')
  })

  it('nests trashedAt under app with other application properties', () => {
    expect(
      serializeDocument(
        {
          favorite: true,
          trashedAt: '2025-01-01T00:00:00.000Z',
        },
        '# Hi',
      ),
    ).toBe(
      '---\napp:\n  favorite: true\n  trashedAt: 2025-01-01T00:00:00.000Z\n---\n# Hi',
    )
  })
})

describe('parseDocument', () => {
  it('promotes app namespace properties to flat note properties', () => {
    expect(parseDocument('---\napp:\n  favorite: true\n---\n# Hello')).toEqual({
      properties: {
        favorite: true,
      },
      content: '# Hello',
    })
  })

  it('returns top-level properties unchanged when app key is missing', () => {
    expect(parseDocument('---\ntags:\n  - cooking\n---\n# Hello')).toEqual({
      properties: {
        tags: ['cooking'],
      },
      content: '# Hello',
    })
  })

  it('round-trips user-defined and application properties together', () => {
    const document = serializeDocument(
      {
        favorite: true,
        meta: {
          nested: true,
        },
        tags: ['cooking'],
      },
      '# Hello',
    )

    expect(parseDocument(document)).toEqual({
      properties: {
        favorite: true,
        meta: {
          nested: true,
        },
        tags: ['cooking'],
      },
      content: '# Hello',
    })
  })

  it('round-trips trashedAt under app', () => {
    const document = serializeDocument(
      {
        trashedAt: '2025-03-01T12:00:00.000Z',
      },
      '# Body',
    )

    expect(parseDocument(document)).toEqual({
      properties: {
        trashedAt: '2025-03-01T12:00:00.000Z',
      },
      content: '# Body',
    })
  })

  it('round-trips favorite under app', () => {
    const document = serializeDocument(
      {
        favorite: true,
      },
      '# Body',
    )

    expect(parseDocument(document)).toEqual({
      properties: {
        favorite: true,
      },
      content: '# Body',
    })
  })

  it('round-trips pinned under app', () => {
    const document = serializeDocument(
      {
        pinned: true,
      },
      '# Body',
    )

    expect(parseDocument(document)).toEqual({
      properties: {
        pinned: true,
      },
      content: '# Body',
    })
  })

  it('round-trips webhook under app', () => {
    const document = serializeDocument(
      {
        webhook: 'https://example.com/webhook',
      },
      '# Body',
    )

    expect(parseDocument(document)).toEqual({
      properties: {
        webhook: 'https://example.com/webhook',
      },
      content: '# Body',
    })
  })
})
