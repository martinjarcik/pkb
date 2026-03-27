import { describe, expect, it } from 'vitest'
import { parseDocument, serializeDocument } from '~/storage/document'

describe('serializeDocument', () => {
  it('nests application properties under the app key', () => {
    expect(
      serializeDocument(
        {
          hasTasks: true,
        },
        '# Hello',
      ),
    ).toBe('---\napp:\n  hasTasks: true\n---\n# Hello')
  })

  it('keeps user-defined properties at the top level', () => {
    expect(
      serializeDocument(
        {
          hasTasks: true,
          tags: ['cooking'],
        },
        '# Hello',
      ),
    ).toBe('---\ntags:\n  - cooking\napp:\n  hasTasks: true\n---\n# Hello')
  })

  it('nests trashedAt under app with other application properties', () => {
    expect(
      serializeDocument(
        {
          hasTasks: false,
          trashedAt: '2025-01-01T00:00:00.000Z',
        },
        '# Hi',
      ),
    ).toBe(
      '---\napp:\n  hasTasks: false\n  trashedAt: 2025-01-01T00:00:00.000Z\n---\n# Hi',
    )
  })
})

describe('parseDocument', () => {
  it('promotes app namespace properties to flat note properties', () => {
    expect(parseDocument('---\napp:\n  hasTasks: true\n---\n# Hello')).toEqual({
      properties: {
        hasTasks: true,
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
        hasTasks: true,
        meta: {
          nested: true,
        },
        tags: ['cooking'],
      },
      '# Hello',
    )

    expect(parseDocument(document)).toEqual({
      properties: {
        hasTasks: true,
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
        hasTasks: false,
        trashedAt: '2025-03-01T12:00:00.000Z',
      },
      '# Body',
    )

    expect(parseDocument(document)).toEqual({
      properties: {
        hasTasks: false,
        trashedAt: '2025-03-01T12:00:00.000Z',
      },
      content: '# Body',
    })
  })

  it('round-trips favorite under app', () => {
    const document = serializeDocument(
      {
        hasTasks: false,
        favorite: true,
      },
      '# Body',
    )

    expect(parseDocument(document)).toEqual({
      properties: {
        hasTasks: false,
        favorite: true,
      },
      content: '# Body',
    })
  })

  it('round-trips pinned under app', () => {
    const document = serializeDocument(
      {
        hasTasks: false,
        pinned: true,
      },
      '# Body',
    )

    expect(parseDocument(document)).toEqual({
      properties: {
        hasTasks: false,
        pinned: true,
      },
      content: '# Body',
    })
  })
})
