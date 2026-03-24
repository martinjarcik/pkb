import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { browserStorage } from '~/storage/browser'

type StoredNote = {
  document: string
  createdAt: string
  modifiedAt: string
}

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key) {
      return store.get(key) ?? null
    },
    key(index) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key) {
      store.delete(key)
    },
    setItem(key, value) {
      store.set(key, String(value))
    },
  }
}

function readStoredNotes(): Record<string, StoredNote> {
  return JSON.parse(localStorage.getItem('notes') ?? '{}') as Record<
    string,
    StoredNote
  >
}

describe('browserStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns the saved note with properties and timestamps', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    const note = await browserStorage.saveNote({
      id: 'notes/welcome.md',
      properties: { title: 'Welcome' },
      content: '# Hello',
    })

    expect(note).toEqual({
      id: 'notes/welcome.md',
      title: 'Welcome',
      content: '# Hello',
      createdAt: '2026-03-20T10:00:00.000Z',
      modifiedAt: '2026-03-20T10:00:00.000Z',
    })
  })

  it('persists notes as markdown with yaml frontmatter', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    await browserStorage.saveNote({
      id: 'notes/welcome.md',
      properties: { title: 'Welcome', published: true },
      content: '# Hello',
    })

    expect(readStoredNotes()['notes/welcome.md']!.document).toBe(
      '---\ntitle: Welcome\npublished: true\n---\n# Hello',
    )
  })

  it('excludes reserved fields from persisted frontmatter', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    const note = await browserStorage.saveNote({
      id: 'notes/welcome.md',
      properties: {
        title: 'Keep',
        id: 'ignored',
        content: 'ignored',
        createdAt: 'ignored',
        modifiedAt: 'ignored',
      },
      content: '# Hello',
    })

    expect(note.id).toBe('notes/welcome.md')
    expect(note.content).toBe('# Hello')
  })

  it('loads browser notes as flat notes with storage timestamps', async () => {
    localStorage.setItem(
      'notes',
      JSON.stringify({
        'notes/welcome.md': {
          document:
            '---\ntitle: Welcome\npublished: true\nviews: 3\nmeta:\n  nested: true\ncreatedAt: ignored\n---\n# Hello',
          createdAt: '2026-03-19T09:00:00.000Z',
          modifiedAt: '2026-03-20T11:00:00.000Z',
        },
      }),
    )

    await expect(browserStorage.loadNotes()).resolves.toEqual([
      {
        id: 'notes/welcome.md',
        title: 'Welcome',
        published: true,
        views: 3,
        meta: { nested: true },
        content: '# Hello',
        createdAt: '2026-03-19T09:00:00.000Z',
        modifiedAt: '2026-03-20T11:00:00.000Z',
      },
    ])
  })

  it('preserves createdAt and refreshes modifiedAt on update', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    await browserStorage.saveNote({
      id: 'notes/welcome.md',
      properties: { title: 'Welcome' },
      content: '# Hello',
    })

    vi.setSystemTime(new Date('2026-03-20T12:00:00.000Z'))

    const updated = await browserStorage.saveNote({
      id: 'notes/welcome.md',
      properties: { title: 'Updated' },
      content: '# Updated',
    })

    expect(updated).toEqual({
      id: 'notes/welcome.md',
      title: 'Updated',
      content: '# Updated',
      createdAt: '2026-03-20T10:00:00.000Z',
      modifiedAt: '2026-03-20T12:00:00.000Z',
    })
  })

  it('loads documents with non-LF line endings', async () => {
    localStorage.setItem(
      'notes',
      JSON.stringify({
        'notes/crlf.md': {
          document: '---\r\ntitle: CRLF\r\n---\r\n# Hello\r\nworld',
          createdAt: '2026-03-19T09:00:00.000Z',
          modifiedAt: '2026-03-20T11:00:00.000Z',
        },
        'notes/cr.md': {
          document: '---\rtitle: CR\r---\r# Hello\rworld',
          createdAt: '2026-03-19T09:00:00.000Z',
          modifiedAt: '2026-03-20T11:00:00.000Z',
        },
      }),
    )

    await expect(browserStorage.loadNotes()).resolves.toEqual([
      {
        id: 'notes/crlf.md',
        title: 'CRLF',
        content: '# Hello\nworld',
        createdAt: '2026-03-19T09:00:00.000Z',
        modifiedAt: '2026-03-20T11:00:00.000Z',
      },
      {
        id: 'notes/cr.md',
        title: 'CR',
        content: '# Hello\nworld',
        createdAt: '2026-03-19T09:00:00.000Z',
        modifiedAt: '2026-03-20T11:00:00.000Z',
      },
    ])
  })

  it('stores raw content without frontmatter wrapper when properties are empty', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    await browserStorage.saveNote({
      id: 'notes/plain.md',
      properties: {},
      content: '# Just content',
    })

    const stored = readStoredNotes()

    expect(stored['notes/plain.md']!.document).toBe('# Just content')
  })

  it('isolates content from broken frontmatter', async () => {
    localStorage.setItem(
      'notes',
      JSON.stringify({
        'notes/broken.md': {
          document: '---\ntitle: [invalid yaml\n---\n# Still readable',
          createdAt: '2026-03-19T09:00:00.000Z',
          modifiedAt: '2026-03-20T11:00:00.000Z',
        },
      }),
    )

    await expect(browserStorage.loadNotes()).resolves.toEqual([
      {
        id: 'notes/broken.md',
        content: '# Still readable',
        createdAt: '2026-03-19T09:00:00.000Z',
        modifiedAt: '2026-03-20T11:00:00.000Z',
      },
    ])
  })

  it('coerces non-string stored note fields instead of dropping entries', async () => {
    localStorage.setItem(
      'notes',
      JSON.stringify({
        'notes/ok.md': {
          document: '---\ntitle: Fine\n---\n# Body',
          createdAt: '2026-03-19T09:00:00.000Z',
          modifiedAt: '2026-03-20T11:00:00.000Z',
        },
        'notes/bad-types.md': {
          document: 42,
          createdAt: false,
          modifiedAt: null,
        },
        'notes/primitive.md': 'not an object',
      }),
    )

    await expect(browserStorage.loadNotes()).resolves.toEqual([
      {
        id: 'notes/ok.md',
        title: 'Fine',
        content: '# Body',
        createdAt: '2026-03-19T09:00:00.000Z',
        modifiedAt: '2026-03-20T11:00:00.000Z',
      },
      {
        id: 'notes/bad-types.md',
        content: '42',
        createdAt: 'false',
        modifiedAt: '',
      },
    ])
  })

  it('returns loaded notes ordered by most recently modified first', async () => {
    localStorage.setItem(
      'notes',
      JSON.stringify({
        'notes/older.md': {
          document: '# Older',
          createdAt: '2026-03-18T00:00:00.000Z',
          modifiedAt: '2026-03-18T00:00:00.000Z',
        },
        'notes/newer.md': {
          document: '# Newer',
          createdAt: '2026-03-20T00:00:00.000Z',
          modifiedAt: '2026-03-20T00:00:00.000Z',
        },
      }),
    )

    const notes = await browserStorage.loadNotes()

    expect(notes.map((n) => n.id)).toEqual(['notes/newer.md', 'notes/older.md'])
  })

  it('deletes notes by id', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    await browserStorage.saveNote({
      id: 'notes/welcome.md',
      properties: { title: 'Welcome' },
      content: '# Hello',
    })

    await browserStorage.deleteNote('notes/welcome.md')

    await expect(browserStorage.loadNotes()).resolves.toEqual([])
  })
})
