import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'
import { noteTitleFromId } from '~/notes/noteTitleFromId'
import type { Note, NoteProperties } from '~/notes/types'
import type { NoteStorage, SaveNoteInput } from '~/storage/types'
import { useNotes } from '~/composables/useNotes'

const { stateStore, storageMock } = vi.hoisted(() => {
  const storageMock: NoteStorage = {
    loadAllNotes: vi.fn<() => Promise<Note[]>>().mockResolvedValue([]),
    loadExplicitFolders: vi.fn<() => Promise<string[]>>().mockResolvedValue([]),
    saveNote: vi.fn<(input: SaveNoteInput) => Promise<Note>>(),
    renameNoteTitle: vi.fn(),
    moveNote: vi.fn(),
    softDeleteNote: vi.fn(),
    deleteNote: vi
      .fn<(id: string) => Promise<void>>()
      .mockResolvedValue(undefined),
    createFolder: vi.fn(),
    renameFolder: vi.fn(),
  }

  return {
    stateStore: new Map<string, { value: unknown }>(),
    storageMock,
  }
})

function mockedUseState<T>(key: string, init: () => T) {
  if (!stateStore.has(key)) {
    stateStore.set(key, { value: init() })
  }

  return stateStore.get(key) as { value: T }
}

vi.mock('#app', () => ({
  useState: mockedUseState,
}))

vi.mock('#imports', () => ({
  useState: mockedUseState,
}))

vi.mock('nuxt/app', () => ({
  useState: mockedUseState,
}))

vi.mock('~/composables/useTranslations', () => ({
  t: (key: string) =>
    (
      ({
        'notes.newNoteTitle': 'New Note',
        'notes.errorCreateFallback': 'Failed to create note',
      }) as Record<string, string>
    )[key] ?? key,
}))

vi.mock('~/composables/useNoteStorage', () => ({
  useNoteStorage: () => ({
    storage: { value: storageMock },
  }),
}))

vi.mock('~/composables/useAppConfigDisk', () => ({
  useAppConfigDisk: () => ({
    data: {
      value: {
        storageType: 'filesystem',
        vault: './vault',
        notes: { trashRetentionDays: 30 },
        editor: { autosaveDelay: 300, assetsFolder: 'assets' },
        layout: {
          showInspectorPanel: true,
          showSidebarPanel: true,
          showNotesListPanel: true,
        },
        theme: { accentColor: '#000000', defaultEditorColor: 'yellow' },
        editorColors: {},
        features: {
          favorites: true,
          tasks: true,
          pinned: true,
          nonDistractionMode: true,
          noteWebhook: true,
        },
        locale: 'en',
      },
    },
    loadAppConfigDisk: vi.fn(),
    saveAppConfigPatch: vi.fn(),
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

describe('useNotes', () => {
  beforeEach(() => {
    stateStore.clear()
    vi.mocked(storageMock.loadAllNotes).mockReset().mockResolvedValue([])
    vi.mocked(storageMock.deleteNote).mockReset().mockResolvedValue(undefined)
    vi.mocked(storageMock.saveNote).mockReset()
    vi.mocked(storageMock.renameNoteTitle).mockReset()
    vi.mocked(storageMock.moveNote).mockReset()
    vi.mocked(storageMock.softDeleteNote).mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('selects the first note after loading the catalog', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('first.md', '# Full note\n\nMore content', '2026-03-24'),
      createTestNote('second.md', '# Second full note', '2026-03-23'),
    ])

    const { loadNotes, notes, selectedNoteId, selectNoteById } = useNotes()
    await loadNotes()
    await selectNoteById(notes.value[0]?.id ?? null)

    expect(selectedNoteId.value).toBe('first.md')
  })

  it('provides the full content for the selected note from memory', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('first.md', '# Full note\n\nMore content', '2026-03-24'),
    ])

    const { loadNotes, notes, selectedNote, selectNoteById } = useNotes()
    await loadNotes()
    await selectNoteById(notes.value[0]?.id ?? null)

    expect(selectedNote.value?.content).toBe('# Full note\n\nMore content')
  })

  it('clears the selected note for an empty catalog payload', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([])

    const { selectedNoteId, loadNotes } = useNotes()
    await loadNotes()

    expect(selectedNoteId.value).toBeNull()
  })

  it('exposes the error message when catalog loading fails', async () => {
    vi.mocked(storageMock.loadAllNotes).mockRejectedValue(
      new Error('Network down'),
    )

    const { loadError, loadNotes } = useNotes()
    await loadNotes()

    expect(loadError.value).toBe('Network down')
  })

  it('selects a note by looking up from in-memory store', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('first.md', '# First content', '2026-03-24'),
      createTestNote('second.md', '# Second full note', '2026-03-23'),
    ])

    const { loadNotes, selectedNote, selectedNoteId, selectNoteById } =
      useNotes()
    await loadNotes()
    await selectNoteById('second.md')

    expect(selectedNoteId.value).toBe('second.md')
    expect(selectedNote.value?.content).toBe('# Second full note')
  })

  it('selects a note with spaces in the id', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('backlog/second note.md', '# Full', '2026-03-24'),
    ])

    const { loadNotes, selectedNote, selectNoteById } = useNotes()
    await loadNotes()
    await selectNoteById('backlog/second note.md')

    expect(selectedNote.value?.content).toBe('# Full')
  })

  it('clears the selected note title when no note is selected', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('first.md', '# Full', '2026-03-24'),
    ])

    const { loadNotes, selectedNoteTitle, selectNoteById } = useNotes()
    await loadNotes()
    await selectNoteById('first.md')
    await selectNoteById(null)

    expect(selectedNoteTitle.value).toBe('')
  })

  it('retargets selection to the new id after renaming', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('nested/first.md', '# First', '2026-03-24'),
    ])
    vi.mocked(storageMock.renameNoteTitle).mockResolvedValue(
      createTestNote('nested/Renamed title.md', '# First', '2026-03-24'),
    )

    const {
      loadNotes,
      selectedNoteId,
      renameSelectedNoteTitle,
      selectNoteById,
    } = useNotes()
    await loadNotes()
    await selectNoteById('nested/first.md')
    await renameSelectedNoteTitle('Renamed title')

    expect(selectedNoteId.value).toBe('nested/Renamed title.md')
  })

  it('retargets selection to the new id after moving a note', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('first.md', '# First', '2026-03-24'),
      createTestNote('recipes/existing.md', '# Existing', '2026-03-23'),
    ])
    vi.mocked(storageMock.moveNote).mockResolvedValue(
      createTestNote('recipes/first.md', '# First', '2026-03-24'),
    )

    const { loadNotes, moveNote, selectedNoteId, selectNoteById } = useNotes()
    await loadNotes()
    await selectNoteById('first.md')
    await moveNote('first.md', 'recipes')

    expect(selectedNoteId.value).toBe('recipes/first.md')
  })

  it('prepends the created note to the list', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('existing.md', '# Existing', '2026-03-24'),
    ])
    vi.mocked(storageMock.saveNote).mockResolvedValue(
      createTestNote('New Note.md', '', '2026-03-25'),
    )

    const { loadNotes, createNote: createNewNote, notes } = useNotes()
    await loadNotes()
    await createNewNote()

    expect(notes.value.map((note) => note.id)).toEqual([
      'New Note.md',
      'existing.md',
    ])
  })

  it('selects the newly created note', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('existing.md', '# Existing', '2026-03-24'),
    ])
    vi.mocked(storageMock.saveNote).mockResolvedValue(
      createTestNote('New Note.md', '', '2026-03-25'),
    )

    const { loadNotes, createNote: createNewNote, selectedNoteId } = useNotes()
    await loadNotes()
    await createNewNote()

    expect(selectedNoteId.value).toBe('New Note.md')
  })

  it('signals that the title should be focused after creating a note', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('existing.md', '# Existing', '2026-03-24'),
    ])
    vi.mocked(storageMock.saveNote).mockResolvedValue(
      createTestNote('New Note.md', '', '2026-03-25'),
    )

    const {
      loadNotes,
      createNote: createNewNote,
      shouldFocusTitle,
    } = useNotes()
    await loadNotes()
    await createNewNote()

    expect(shouldFocusTitle.value).toBe(true)
  })

  it('appends a suffix when the default title already exists', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('New Note.md', '# Existing', '2026-03-24'),
    ])
    vi.mocked(storageMock.saveNote).mockImplementation(
      async (input: SaveNoteInput) =>
        createTestNote(input.id, input.content, '2026-03-25'),
    )

    const { loadNotes, createNote: createNewNote, notes } = useNotes()
    await loadNotes()
    await createNewNote()

    expect(notes.value[0]?.id).toBe('New Note (2).md')
  })

  it('creates a new note inside the provided parent folder', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([])
    vi.mocked(storageMock.saveNote).mockImplementation(
      async (input: SaveNoteInput) =>
        createTestNote(input.id, input.content, '2026-03-25'),
    )

    const { loadNotes, createNote: createNewNote, notes } = useNotes()
    await loadNotes()
    await createNewNote('Work')

    expect(notes.value[0]?.id).toBe('Work/New Note.md')
  })

  it('sets the save error when note creation fails', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([])
    vi.mocked(storageMock.saveNote).mockRejectedValue(
      new Error('Create failed'),
    )

    const { loadNotes, createNote: createNewNote, saveError } = useNotes()
    await loadNotes()
    await createNewNote()

    expect(saveError.value).toBe('Create failed')
  })

  it('calls storage.saveNote with full note properties', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('entry.md', '# Full note\n\nLonger body', '2026-03-24', {
        rating: 5,
      }),
    ])
    vi.mocked(storageMock.saveNote).mockResolvedValue(
      createTestNote('entry.md', '# Updated note', '2026-03-25', {
        rating: 5,
      }),
    )

    const { loadNotes, saveSelectedNoteContent, selectNoteById } = useNotes()
    await loadNotes()
    await selectNoteById('entry.md')
    await saveSelectedNoteContent('# Updated note')

    expect(storageMock.saveNote).toHaveBeenCalledWith({
      id: 'entry.md',
      properties: expect.objectContaining({ rating: 5 }) as NoteProperties,
      content: '# Updated note',
    })
  })

  it('keeps the in-memory full-note store in sync after trashing a note', async () => {
    vi.mocked(storageMock.loadAllNotes).mockResolvedValue([
      createTestNote('entry.md', '# Body', '2026-03-24'),
    ])
    vi.mocked(storageMock.softDeleteNote).mockResolvedValue(
      createTestNote('entry.md', '# Body', '2026-03-25', {
        trashedAt: '2026-03-25T10:00:00.000Z',
      }),
    )

    const { allNotes, deleteSelectedNote, loadNotes, notes, selectNoteById } =
      useNotes()
    await loadNotes()
    await selectNoteById('entry.md')
    await deleteSelectedNote(['entry.md'])

    expect(allNotes.value[0]?.trashedAt).toBe('2026-03-25T10:00:00.000Z')
    expect(notes.value[0]?.trashedAt).toBe('2026-03-25T10:00:00.000Z')
  })
})
