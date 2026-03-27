import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NOTE_CATALOG_CONTENT_BYTES } from '~/notes/types'
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
      properties: { label: 'Welcome' },
      content: '# Hello',
    })

    expect(note).toEqual({
      id: 'notes/welcome.md',
      label: 'Welcome',
      content: '# Hello',
      createdAt: '2026-03-20T10:00:00.000Z',
      modifiedAt: '2026-03-20T10:00:00.000Z',
      title: 'welcome',
      description: '',
    })
  })

  it('persists notes as markdown with yaml frontmatter', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    await browserStorage.saveNote({
      id: 'notes/welcome.md',
      properties: { label: 'Welcome', published: true },
      content: '# Hello',
    })

    expect(readStoredNotes()['notes/welcome.md']!.document).toBe(
      '---\nlabel: Welcome\npublished: true\n---\n# Hello',
    )
  })

  it('excludes reserved fields from persisted frontmatter', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    await browserStorage.saveNote({
      id: 'notes/welcome.md',
      properties: {
        label: 'Keep',
        id: 'ignored',
        content: 'ignored',
        createdAt: 'ignored',
        modifiedAt: 'ignored',
        title: 'ignored',
        description: 'ignored',
      },
      content: '# Hello',
    })

    expect(readStoredNotes()['notes/welcome.md']!.document).toBe(
      '---\nlabel: Keep\n---\n# Hello',
    )
  })

  it('loads browser notes as flat notes with storage timestamps', async () => {
    localStorage.setItem(
      'notes',
      JSON.stringify({
        'notes/welcome.md': {
          document:
            '---\nlabel: Welcome\npublished: true\nviews: 3\nmeta:\n  nested: true\ncreatedAt: ignored\n---\n# Hello',
          createdAt: '2026-03-19T09:00:00.000Z',
          modifiedAt: '2026-03-20T11:00:00.000Z',
        },
      }),
    )

    await expect(browserStorage.loadNotesCatalog()).resolves.toEqual([
      {
        id: 'notes/welcome.md',
        label: 'Welcome',
        published: true,
        views: 3,
        meta: { nested: true },
        content: '# Hello',
        createdAt: '2026-03-19T09:00:00.000Z',
        modifiedAt: '2026-03-20T11:00:00.000Z',
        title: 'welcome',
        description: '',
      },
    ])
  })

  it('preserves createdAt and refreshes modifiedAt on update', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    await browserStorage.saveNote({
      id: 'notes/welcome.md',
      properties: { label: 'Welcome' },
      content: '# Hello',
    })

    vi.setSystemTime(new Date('2026-03-20T12:00:00.000Z'))

    const updated = await browserStorage.saveNote({
      id: 'notes/welcome.md',
      properties: { label: 'Updated' },
      content: '# Updated',
    })

    expect(updated).toEqual({
      id: 'notes/welcome.md',
      label: 'Updated',
      content: '# Updated',
      createdAt: '2026-03-20T10:00:00.000Z',
      modifiedAt: '2026-03-20T12:00:00.000Z',
      title: 'welcome',
      description: '',
    })
  })

  it('normalizes CRLF line endings to LF when loading', async () => {
    localStorage.setItem(
      'notes',
      JSON.stringify({
        'notes/crlf.md': {
          document: '---\r\nlabel: CRLF\r\n---\r\n# Hello\r\nworld',
          createdAt: '2026-03-19T09:00:00.000Z',
          modifiedAt: '2026-03-20T11:00:00.000Z',
        },
      }),
    )

    const [note] = await browserStorage.loadNotesCatalog()

    expect(note?.content).toBe('# Hello\nworld')
  })

  it('normalizes CR line endings to LF when loading', async () => {
    localStorage.setItem(
      'notes',
      JSON.stringify({
        'notes/cr.md': {
          document: '---\rlabel: CR\r---\r# Hello\rworld',
          createdAt: '2026-03-19T09:00:00.000Z',
          modifiedAt: '2026-03-20T11:00:00.000Z',
        },
      }),
    )

    const [note] = await browserStorage.loadNotesCatalog()

    expect(note?.content).toBe('# Hello\nworld')
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
          document: '---\nlabel: [invalid yaml\n---\n# Still readable',
          createdAt: '2026-03-19T09:00:00.000Z',
          modifiedAt: '2026-03-20T11:00:00.000Z',
        },
      }),
    )

    await expect(browserStorage.loadNotesCatalog()).resolves.toEqual([
      {
        id: 'notes/broken.md',
        content: '# Still readable',
        createdAt: '2026-03-19T09:00:00.000Z',
        modifiedAt: '2026-03-20T11:00:00.000Z',
        title: 'broken',
        description: '',
      },
    ])
  })

  it('coerces non-string stored note fields instead of dropping entries', async () => {
    localStorage.setItem(
      'notes',
      JSON.stringify({
        'notes/ok.md': {
          document: '---\nlabel: Fine\n---\n# Body',
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

    await expect(browserStorage.loadNotesCatalog()).resolves.toEqual([
      {
        id: 'notes/ok.md',
        label: 'Fine',
        content: '# Body',
        createdAt: '2026-03-19T09:00:00.000Z',
        modifiedAt: '2026-03-20T11:00:00.000Z',
        title: 'ok',
        description: '',
      },
      {
        id: 'notes/bad-types.md',
        content: '42',
        createdAt: 'false',
        modifiedAt: '',
        title: 'bad-types',
        description: '42',
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

    const notes = await browserStorage.loadNotesCatalog()

    expect(notes.map((n) => n.id)).toEqual(['notes/newer.md', 'notes/older.md'])
  })

  it('deletes notes by id', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    await browserStorage.saveNote({
      id: 'notes/welcome.md',
      properties: { label: 'Welcome' },
      content: '# Hello',
    })

    await browserStorage.deleteNote('notes/welcome.md')

    await expect(browserStorage.loadNotesCatalog()).resolves.toEqual([])
  })

  it('loads a full note by id', async () => {
    localStorage.setItem(
      'notes',
      JSON.stringify({
        'notes/welcome.md': {
          document: '---\nlabel: Welcome\n---\n# Full note',
          createdAt: '2026-03-19T09:00:00.000Z',
          modifiedAt: '2026-03-20T11:00:00.000Z',
        },
      }),
    )

    await expect(
      browserStorage.loadNoteById('notes/welcome.md'),
    ).resolves.toEqual({
      id: 'notes/welcome.md',
      label: 'Welcome',
      content: '# Full note',
      createdAt: '2026-03-19T09:00:00.000Z',
      modifiedAt: '2026-03-20T11:00:00.000Z',
      title: 'welcome',
      description: '',
    })
  })

  it('returns null when a browser note is missing', async () => {
    await expect(browserStorage.loadNoteById('missing.md')).resolves.toBeNull()
  })

  it('truncates catalog content to the first 1024 utf-8 bytes', async () => {
    localStorage.setItem(
      'notes',
      JSON.stringify({
        'notes/emoji.md': {
          document: `---\nlabel: Emoji\n---\n${'🙂'.repeat(300)}`,
          createdAt: '2026-03-19T09:00:00.000Z',
          modifiedAt: '2026-03-20T11:00:00.000Z',
        },
      }),
    )

    const [note] = await browserStorage.loadNotesCatalog()

    expect(new TextEncoder().encode(note?.content ?? '').length).toBe(
      NOTE_CATALOG_CONTENT_BYTES,
    )
  })

  it('renames a note title and returns the new id', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    await browserStorage.saveNote({
      id: 'notes/original.md',
      properties: { label: 'Original' },
      content: '# Body',
    })

    const renamed = await browserStorage.renameNoteTitle({
      id: 'notes/original.md',
      title: 'Updated title',
    })

    expect(renamed.id).toBe('notes/Updated title.md')
  })

  it('removes the old storage key after renaming', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    await browserStorage.saveNote({
      id: 'notes/original.md',
      properties: { label: 'Original' },
      content: '# Body',
    })

    await browserStorage.renameNoteTitle({
      id: 'notes/original.md',
      title: 'Updated title',
    })

    expect(Object.keys(readStoredNotes())).toEqual(['notes/Updated title.md'])
  })

  it('adds a numeric suffix when browser rename collides', async () => {
    vi.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))

    await browserStorage.saveNote({
      id: 'notes/first.md',
      properties: { label: 'First' },
      content: '# First',
    })
    await browserStorage.saveNote({
      id: 'notes/second.md',
      properties: { label: 'Second' },
      content: '# Second',
    })

    const renamed = await browserStorage.renameNoteTitle({
      id: 'notes/second.md',
      title: 'first',
    })

    expect(renamed.id).toBe('notes/first (2).md')
  })

  it('persists an explicit folder name in localStorage', async () => {
    await browserStorage.createFolder('Projects')

    const stored = JSON.parse(
      localStorage.getItem('folders') ?? '[]',
    ) as string[]

    expect(stored).toEqual(['Projects'])
  })

  it('does not duplicate an already-stored folder name', async () => {
    await browserStorage.createFolder('Projects')
    await browserStorage.createFolder('Projects')

    const stored = JSON.parse(
      localStorage.getItem('folders') ?? '[]',
    ) as string[]

    expect(stored).toEqual(['Projects'])
  })
})
