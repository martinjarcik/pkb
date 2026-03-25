import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Note } from '~/notes/types'
import { createNotesListItems, useNotes } from '~/composables/useNotes'

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

function createTestNote(id: string, content: string, modifiedAt: string): Note {
  return {
    id,
    content,
    createdAt: '2026-03-20T00:00:00.000Z',
    modifiedAt,
  }
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

  it('selects the first loaded note', async () => {
    fetchMock.mockResolvedValue([
      createTestNote('first.md', '# First', '2026-03-24'),
      createTestNote('second.md', '# Second', '2026-03-23'),
    ])

    const { selectedNoteId, loadNotes } = useNotes()
    await loadNotes()

    expect(selectedNoteId.value).toBe('first.md')
  })

  it('clears the selected note for an empty payload', async () => {
    fetchMock.mockResolvedValue([])

    const { selectedNoteId, loadNotes } = useNotes()
    await loadNotes()

    expect(selectedNoteId.value).toBeNull()
  })

  it('exposes the error message when loading fails', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'))

    const { loadError, loadNotes } = useNotes()
    await loadNotes()

    expect(loadError.value).toBe('Network down')
  })

  it('updates the selected note by id', async () => {
    const { notes, selectedNoteId, selectNoteById } = useNotes()

    notes.value = [
      createTestNote(
        'first.md',
        '# First note\n\nA longer preview body for the first note.',
        '2026-03-24',
      ),
      createTestNote(
        'second.md',
        '# Second note\n\nSome note content',
        '2026-03-23',
      ),
    ]

    await selectNoteById('second.md')

    expect(selectedNoteId.value).toBe('second.md')
  })

  it('exposes the selected note title for the current selection', async () => {
    const { notes, selectedNoteTitle, selectNoteById } = useNotes()

    notes.value = [
      createTestNote('backlog/first-note.md', '# First', '2026-03-24'),
      createTestNote('second-note.md', '# Second', '2026-03-23'),
    ]

    await selectNoteById('backlog/first-note.md')

    expect(selectedNoteTitle.value).toBe('first-note')
  })

  it('clears the selected note title when no note is selected', async () => {
    const { notes, selectedNoteTitle, selectNoteById } = useNotes()

    notes.value = [createTestNote('first.md', '# First', '2026-03-24')]

    await selectNoteById('first.md')
    await selectNoteById(null)

    expect(selectedNoteTitle.value).toBe('')
  })

  it('updates the selected note title when the selection changes', async () => {
    const { notes, selectedNoteTitle, selectNoteById } = useNotes()

    notes.value = [
      createTestNote('first.md', '# First', '2026-03-24'),
      createTestNote('nested/second.md', '# Second', '2026-03-23'),
    ]

    await selectNoteById('first.md')
    await selectNoteById('nested/second.md')

    expect(selectedNoteTitle.value).toBe('second')
  })

  it('renames the selected note title and retargets selection to the new id', async () => {
    const { notes, selectedNoteId, renameSelectedNoteTitle } = useNotes()

    notes.value = [createTestNote('nested/first.md', '# First', '2026-03-24')]
    selectedNoteId.value = 'nested/first.md'
    fetchMock.mockResolvedValue({
      ...createTestNote('nested/Renamed title.md', '# First', '2026-03-24'),
    })

    await renameSelectedNoteTitle('Renamed title')

    expect(fetchMock).toHaveBeenCalledWith('/api/notes', {
      method: 'PATCH',
      body: {
        id: 'nested/first.md',
        title: 'Renamed title',
      },
    })
    expect(selectedNoteId.value).toBe('nested/Renamed title.md')
  })

  it('does not overwrite a newer selection after a title rename resolves', async () => {
    const { notes, selectedNoteId, renameSelectedNoteTitle, selectNoteById } =
      useNotes()

    let resolveRename: ((value: Note) => void) | null = null

    notes.value = [
      createTestNote('first.md', '# First', '2026-03-24'),
      createTestNote('second.md', '# Second', '2026-03-23'),
    ]
    selectedNoteId.value = 'first.md'
    fetchMock.mockImplementation(
      () =>
        new Promise<Note>((resolve) => {
          resolveRename = resolve
        }),
    )

    const renamePromise = renameSelectedNoteTitle('Renamed')

    await selectNoteById('second.md')
    if (resolveRename) {
      resolveRename(createTestNote('Renamed.md', '# First', '2026-03-24'))
    }
    await renamePromise

    expect(selectedNoteId.value).toBe('second.md')
  })

  it('creates a new note, prepends it, and selects it', async () => {
    const {
      createNote: createNewNote,
      notes,
      selectedNoteId,
      shouldFocusTitle,
      clearShouldFocusTitle,
    } = useNotes()

    notes.value = [createTestNote('existing.md', '# Existing', '2026-03-24')]
    fetchMock.mockResolvedValue(createTestNote('New Note.md', '', '2026-03-25'))

    await createNewNote()

    expect(notes.value.map((note) => note.id)).toEqual([
      'New Note.md',
      'existing.md',
    ])
    expect(selectedNoteId.value).toBe('New Note.md')
    expect(shouldFocusTitle.value).toBe(true)

    clearShouldFocusTitle()

    expect(shouldFocusTitle.value).toBe(false)
  })

  it('appends a suffix when the default title already exists', async () => {
    const { createNote: createNewNote, notes } = useNotes()

    notes.value = [createTestNote('New Note.md', '# Existing', '2026-03-24')]
    fetchMock.mockResolvedValue(
      createTestNote('New Note (2).md', '', '2026-03-25'),
    )

    await createNewNote()

    expect(fetchMock).toHaveBeenCalledWith('/api/notes', {
      method: 'PUT',
      body: {
        id: 'New Note (2).md',
        properties: {},
        content: '',
      },
    })
  })

  it('calls PUT /api/notes with an empty note payload', async () => {
    const { createNote: createNewNote } = useNotes()

    fetchMock.mockResolvedValue(createTestNote('New Note.md', '', '2026-03-25'))

    await createNewNote()

    expect(fetchMock).toHaveBeenCalledWith('/api/notes', {
      method: 'PUT',
      body: {
        id: 'New Note.md',
        properties: {},
        content: '',
      },
    })
  })

  it('sets the save error when note creation fails', async () => {
    const { createNote: createNewNote, saveError } = useNotes()

    fetchMock.mockRejectedValue(new Error('Create failed'))

    await createNewNote()

    expect(saveError.value).toBe('Create failed')
  })

  it('creates a new note when the list is empty', async () => {
    const { createNote: createNewNote, notes } = useNotes()

    fetchMock.mockResolvedValue(createTestNote('New Note.md', '', '2026-03-25'))

    await createNewNote()

    expect(notes.value[0]?.id).toBe('New Note.md')
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

  it('uses note id basename without .md as the list item title', () => {
    const [flat] = createNotesListItems([
      createTestNote('my-note.md', '# Heading\n\nBody', '2026-03-24'),
    ])
    expect(flat?.title).toBe('my-note')

    const [nested] = createNotesListItems([
      createTestNote(
        'backlog/this-is-file-name.md',
        '# Heading\n\nBody',
        '2026-03-24',
      ),
    ])
    expect(nested?.title).toBe('this-is-file-name')
  })

  it('omits markdown heading lines from the description preview', () => {
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

  it('strips markdown formatting symbols from the description preview', () => {
    const [listItem] = createNotesListItems([
      createTestNote(
        'formatted.md',
        [
          '# Heading',
          '',
          '- [x] **Bold** item with `code` and [link](https://example.com)',
          '> Quoted _text_ and ~~strikethrough~~.',
        ].join('\n'),
        '2026-03-24',
      ),
    ])

    expect(listItem?.description).toBe(
      'Bold item with code and link Quoted text and strikethrough.',
    )
  })

  it('omits markdown table separator rows from the description preview', () => {
    const [listItem] = createNotesListItems([
      createTestNote(
        'table.md',
        ['| Name | Value |', '| --- | --- |', '| Width | 120px |'].join('\n'),
        '2026-03-24',
      ),
    ])

    expect(listItem?.description).toBe('Name Value Width 120px')
  })
})
