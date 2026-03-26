import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import { noteTitleFromId } from '~/notes/noteTitleFromId'
import type { Note } from '~/notes/types'
import { createNotesListItems, useNotes } from '~/composables/useNotes'

type FetchOptions = {
  method?: string
  body?: unknown
}

type RouteHandler = (options?: FetchOptions) => Promise<unknown> | unknown

const { fetchMock, stateStore } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  stateStore: new Map<string, { value: unknown }>(),
}))

vi.mock('#app', () => {
  return {
    useState<T>(key: string, init: () => T) {
      if (!stateStore.has(key)) {
        stateStore.set(key, { value: init() })
      }

      return stateStore.get(key) as { value: T }
    },
  }
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) =>
      (
        ({
          'notes.newNoteTitle': 'New Note',
          'notes.errorCreateFallback': 'Failed to create note',
        }) as Record<string, string>
      )[key] ?? key,
  }),
}))

function createTestNote(
  id: string,
  content: string,
  modifiedAt: string,
  properties: Record<string, unknown> = {},
): Note {
  return {
    id,
    content,
    createdAt: '2026-03-20T00:00:00.000Z',
    modifiedAt,
    ...properties,
    title: noteTitleFromId(id),
    description: noteDescriptionFromContent(content),
  }
}

function createDeferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void

  return {
    promise: new Promise<T>((nextResolve) => {
      resolve = nextResolve
    }),
    resolve,
  }
}

function mockFetchRoutes(routes: Record<string, RouteHandler | unknown>): void {
  fetchMock.mockImplementation((url: string, options?: FetchOptions) => {
    const method = options?.method ?? 'GET'
    const route = routes[`${method} ${url}`]

    if (route === undefined) {
      throw new Error(`Unhandled fetch: ${method} ${url}`)
    }

    if (typeof route === 'function') {
      return Promise.resolve((route as RouteHandler)(options))
    }

    return Promise.resolve(route)
  })
}

describe('useNotes', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    stateStore.clear()
    vi.stubGlobal('$fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('selects the first note after loading the catalog', async () => {
    mockFetchRoutes({
      'GET /api/notes': [
        createTestNote('first.md', '# Preview', '2026-03-24'),
        createTestNote('second.md', '# Second preview', '2026-03-23'),
      ],
      'GET /api/notes/first.md': createTestNote(
        'first.md',
        '# Full note\n\nMore content',
        '2026-03-24',
      ),
    })

    const { loadNotes, selectedNoteId } = useNotes()
    await loadNotes()

    expect(selectedNoteId.value).toBe('first.md')
  })

  it('fetches the full content for the selected note', async () => {
    mockFetchRoutes({
      'GET /api/notes': [createTestNote('first.md', '# Preview', '2026-03-24')],
      'GET /api/notes/first.md': createTestNote(
        'first.md',
        '# Full note\n\nMore content',
        '2026-03-24',
      ),
    })

    const { loadNotes, selectedNote } = useNotes()
    await loadNotes()

    expect(selectedNote.value?.content).toBe('# Full note\n\nMore content')
  })

  it('clears the selected note for an empty catalog payload', async () => {
    mockFetchRoutes({
      'GET /api/notes': [],
    })

    const { selectedNoteId, loadNotes } = useNotes()
    await loadNotes()

    expect(selectedNoteId.value).toBeNull()
  })

  it('exposes the error message when catalog loading fails', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'))

    const { loadError, loadNotes } = useNotes()
    await loadNotes()

    expect(loadError.value).toBe('Network down')
  })

  it('loads the full note when selection changes', async () => {
    const { notes, selectedNote, selectedNoteId, selectNoteById } = useNotes()

    notes.value = [
      createTestNote(
        'first.md',
        '# First preview\n\nA longer preview body for the first note.',
        '2026-03-24',
      ),
      createTestNote(
        'second.md',
        '# Second preview\n\nSome note content',
        '2026-03-23',
      ),
    ]

    mockFetchRoutes({
      'GET /api/notes/second.md': createTestNote(
        'second.md',
        '# Second full note',
        '2026-03-23',
      ),
    })

    await selectNoteById('second.md')

    expect(selectedNoteId.value).toBe('second.md')
    expect(selectedNote.value?.content).toBe('# Second full note')
  })

  it('loads a note with spaces in the id', async () => {
    const { notes, selectedNote, selectNoteById } = useNotes()

    notes.value = [
      createTestNote('backlog/second note.md', '# Preview', '2026-03-24'),
    ]

    mockFetchRoutes({
      'GET /api/notes/backlog/second%20note.md': createTestNote(
        'backlog/second note.md',
        '# Full',
        '2026-03-24',
      ),
    })

    await selectNoteById('backlog/second note.md')

    expect(selectedNote.value?.content).toBe('# Full')
  })

  it('clears the selected note title when no note is selected', async () => {
    const { notes, selectedNoteTitle, selectNoteById } = useNotes()

    notes.value = [createTestNote('first.md', '# Preview', '2026-03-24')]

    mockFetchRoutes({
      'GET /api/notes/first.md': createTestNote(
        'first.md',
        '# Full',
        '2026-03-24',
      ),
    })

    await selectNoteById('first.md')
    await selectNoteById(null)

    expect(selectedNoteTitle.value).toBe('')
  })

  it('retargets selection to the new id after renaming', async () => {
    const { notes, selectedNoteId, renameSelectedNoteTitle, selectNoteById } =
      useNotes()

    notes.value = [createTestNote('nested/first.md', '# Preview', '2026-03-24')]

    mockFetchRoutes({
      'GET /api/notes/nested/first.md': createTestNote(
        'nested/first.md',
        '# First',
        '2026-03-24',
      ),
      'PATCH /api/notes': createTestNote(
        'nested/Renamed title.md',
        '# First',
        '2026-03-24',
      ),
    })

    await selectNoteById('nested/first.md')
    await renameSelectedNoteTitle('Renamed title')

    expect(selectedNoteId.value).toBe('nested/Renamed title.md')
  })

  it('does not overwrite a newer selection after a title rename resolves', async () => {
    const { notes, selectedNoteId, renameSelectedNoteTitle, selectNoteById } =
      useNotes()
    const renameDeferred = createDeferred<Note>()

    notes.value = [
      createTestNote('first.md', '# First preview', '2026-03-24'),
      createTestNote('second.md', '# Second preview', '2026-03-23'),
    ]

    mockFetchRoutes({
      'GET /api/notes/first.md': createTestNote(
        'first.md',
        '# First',
        '2026-03-24',
      ),
      'GET /api/notes/second.md': createTestNote(
        'second.md',
        '# Second',
        '2026-03-23',
      ),
      'PATCH /api/notes': () => renameDeferred.promise,
    })

    await selectNoteById('first.md')

    const renamePromise = renameSelectedNoteTitle('Renamed')
    await selectNoteById('second.md')
    renameDeferred.resolve(
      createTestNote('Renamed.md', '# First', '2026-03-24'),
    )
    await renamePromise

    expect(selectedNoteId.value).toBe('second.md')
  })

  it('prepends the created note to the list', async () => {
    const { createNote: createNewNote, notes } = useNotes()

    notes.value = [createTestNote('existing.md', '# Existing', '2026-03-24')]

    mockFetchRoutes({
      'PUT /api/notes': createTestNote('New Note.md', '', '2026-03-25'),
    })

    await createNewNote()

    expect(notes.value.map((note) => note.id)).toEqual([
      'New Note.md',
      'existing.md',
    ])
  })

  it('selects the newly created note', async () => {
    const { createNote: createNewNote, notes, selectedNoteId } = useNotes()

    notes.value = [createTestNote('existing.md', '# Existing', '2026-03-24')]

    mockFetchRoutes({
      'PUT /api/notes': createTestNote('New Note.md', '', '2026-03-25'),
    })

    await createNewNote()

    expect(selectedNoteId.value).toBe('New Note.md')
  })

  it('signals that the title should be focused after creating a note', async () => {
    const { createNote: createNewNote, notes, shouldFocusTitle } = useNotes()

    notes.value = [createTestNote('existing.md', '# Existing', '2026-03-24')]

    mockFetchRoutes({
      'PUT /api/notes': createTestNote('New Note.md', '', '2026-03-25'),
    })

    await createNewNote()

    expect(shouldFocusTitle.value).toBe(true)
  })

  it('appends a suffix when the default title already exists', async () => {
    const { createNote: createNewNote, notes } = useNotes()

    notes.value = [createTestNote('New Note.md', '# Existing', '2026-03-24')]

    mockFetchRoutes({
      'PUT /api/notes': createTestNote('New Note (2).md', '', '2026-03-25'),
    })

    await createNewNote()

    expect(notes.value[0]?.id).toBe('New Note (2).md')
  })

  it('creates a new note inside the provided parent folder', async () => {
    const { createNote: createNewNote, notes } = useNotes()

    mockFetchRoutes({
      'PUT /api/notes': createTestNote('Work/New Note.md', '', '2026-03-25'),
    })

    await createNewNote('Work')

    expect(notes.value[0]?.id).toBe('Work/New Note.md')
  })

  it('sets the save error when note creation fails', async () => {
    const { createNote: createNewNote, saveError } = useNotes()

    fetchMock.mockRejectedValue(new Error('Create failed'))

    await createNewNote()

    expect(saveError.value).toBe('Create failed')
  })

  it('includes full note properties in the save request', async () => {
    const { notes, saveSelectedNoteContent, selectNoteById } = useNotes()

    notes.value = [
      createTestNote('entry.md', '# Preview only', '2026-03-24', {
        rating: 5,
      }),
    ]

    mockFetchRoutes({
      'GET /api/notes/entry.md': createTestNote(
        'entry.md',
        '# Full note\n\nLonger body',
        '2026-03-24',
        { rating: 5 },
      ),
      'PUT /api/notes': createTestNote(
        'entry.md',
        '# Updated note',
        '2026-03-25',
        { rating: 5 },
      ),
    })

    await selectNoteById('entry.md')
    await saveSelectedNoteContent('# Updated note')

    expect(fetchMock).toHaveBeenCalledWith('/api/notes', {
      method: 'PUT',
      body: {
        id: 'entry.md',
        properties: { rating: 5 },
        content: '# Updated note',
      },
    })
  })

  it('ignores stale note responses when selection changes quickly', async () => {
    const { notes, selectedNote, selectedNoteId, selectNoteById } = useNotes()
    const firstDeferred = createDeferred<Note>()
    const secondDeferred = createDeferred<Note>()

    notes.value = [
      createTestNote('first.md', '# First preview', '2026-03-24'),
      createTestNote('second.md', '# Second preview', '2026-03-23'),
    ]

    mockFetchRoutes({
      'GET /api/notes/first.md': () => firstDeferred.promise,
      'GET /api/notes/second.md': () => secondDeferred.promise,
    })

    const firstSelection = selectNoteById('first.md')
    const secondSelection = selectNoteById('second.md')

    secondDeferred.resolve(
      createTestNote('second.md', '# Second', '2026-03-23'),
    )
    await secondSelection
    firstDeferred.resolve(createTestNote('first.md', '# First', '2026-03-24'))
    await firstSelection

    expect(selectedNoteId.value).toBe('second.md')
    expect(selectedNote.value?.content).toBe('# Second')
  })

  it('truncates long description previews to 120 characters', () => {
    const [listItem] = createNotesListItems([
      createTestNote(
        'long.md',
        `# Heading\n\n${'a'.repeat(121)}`,
        '2026-03-24',
      ),
    ])

    expect(listItem?.description).toBe(`${'a'.repeat(117)}...`)
  })

  it('preserves the input order of notes', () => {
    const items = createNotesListItems([
      createTestNote('b.md', '# B\n\nBody B', '2026-03-23'),
      createTestNote('a.md', '# A\n\nBody A', '2026-03-20'),
    ])

    expect(items.map((i) => i.id)).toEqual(['b.md', 'a.md'])
  })

  it('reads title from a flat note id', () => {
    const [item] = createNotesListItems([
      createTestNote('my-note.md', '# Heading\n\nBody', '2026-03-24'),
    ])

    expect(item?.title).toBe('my-note')
  })

  it('reads title from a nested note id', () => {
    const [item] = createNotesListItems([
      createTestNote(
        'backlog/this-is-file-name.md',
        '# Heading\n\nBody',
        '2026-03-24',
      ),
    ])

    expect(item?.title).toBe('this-is-file-name')
  })

  it('passes through the description from the note object', () => {
    const [listItem] = createNotesListItems([
      createTestNote(
        'headings.md',
        '# Heading one\n\n## Heading two\n\nBody paragraph that should be shown.',
        '2026-03-24',
      ),
    ])

    expect(listItem).toEqual({
      id: 'headings.md',
      title: 'headings',
      description: 'Body paragraph that should be shown.',
      meta: '2026-03-24',
    })
  })
})
