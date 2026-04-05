import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useNoteMutations } from '~/composables/useNoteMutations'
import type { Note } from '~/notes/types'
import type { NoteStorage } from '~/storage/types'

vi.mock('~/composables/useTranslations', () => ({
  t: (key: string) => key,
}))

vi.mock('~/notes/webhook', () => ({
  dispatchNoteWebhook: vi.fn().mockResolvedValue(undefined),
}))

function createNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note.md',
    content: 'Hello world',
    createdAt: '2026-04-01T00:00:00.000Z',
    modifiedAt: '2026-04-02T00:00:00.000Z',
    title: 'note',
    description: 'Hello world',
    ...overrides,
  }
}

function createStorageMock(): NoteStorage {
  return {
    loadAllNotes: vi.fn(),
    loadFolderNames: vi.fn().mockResolvedValue([]),
    saveNote: vi.fn(),
    renameNoteTitle: vi.fn(),
    moveNote: vi.fn(),
    softDeleteNote: vi.fn(),
    deleteNote: vi.fn(),
    createFolder: vi.fn(),
    renameFolder: vi.fn(),
  }
}

describe('useNoteMutations', () => {
  it('passes the current note into renameNoteTitle', async () => {
    const storage = createStorageMock()
    const note = createNote()
    const renamed = createNote({
      id: 'renamed.md',
      title: 'renamed',
    })
    const selectedNoteId = ref(note.id)
    const selectedNoteFull = ref<Note | null>(note)

    vi.mocked(storage.renameNoteTitle).mockResolvedValue(renamed)

    const mutations = useNoteMutations({
      storage: computed(() => storage),
      catalogState: {
        notes: ref([note]),
        findNoteById: () => note,
        replaceNote: vi.fn(),
        replaceRenamedNote: vi.fn(),
        prependNote: vi.fn(),
        updateNoteContent: vi.fn(),
      },
      selectionState: {
        editorFlush: ref(null),
        selectedNote: selectedNoteFull,
        selectedNoteId,
        selectedNoteFull,
        shouldFocusTitle: ref(false),
        selectNoteById: vi.fn(),
      },
      saveError: ref<string | null>(null),
      isRenamingNoteTitle: ref(false),
    })

    await mutations.renameSelectedNoteTitle('Renamed')

    expect(storage.renameNoteTitle).toHaveBeenCalledWith({
      id: 'note.md',
      title: 'Renamed',
      existingIds: ['note.md'],
      note,
    })
    expect(selectedNoteId.value).toBe('renamed.md')
    expect(selectedNoteFull.value).toEqual(renamed)
  })

  it('passes the selected note into softDeleteNote and selects the next visible note', async () => {
    const storage = createStorageMock()
    const note = createNote()
    const trashedNote = createNote({
      trashedAt: '2026-04-03T00:00:00.000Z',
    })
    const selectedNoteId = ref(note.id)
    const selectedNoteFull = ref<Note | null>(note)
    const selectNoteById = vi.fn().mockResolvedValue(undefined)

    vi.mocked(storage.softDeleteNote).mockResolvedValue(trashedNote)

    const mutations = useNoteMutations({
      storage: computed(() => storage),
      catalogState: {
        notes: ref([note, createNote({ id: 'other.md', title: 'other' })]),
        findNoteById: (id) => (id === note.id ? note : null),
        replaceNote: vi.fn(),
        replaceRenamedNote: vi.fn(),
        prependNote: vi.fn(),
        updateNoteContent: vi.fn(),
      },
      selectionState: {
        editorFlush: ref(null),
        selectedNote: selectedNoteFull,
        selectedNoteId,
        selectedNoteFull,
        shouldFocusTitle: ref(false),
        selectNoteById,
      },
      saveError: ref<string | null>(null),
      isRenamingNoteTitle: ref(false),
    })

    const deleted = await mutations.deleteSelectedNote(['note.md', 'other.md'])

    expect(deleted).toBe(true)
    expect(storage.softDeleteNote).toHaveBeenCalledWith('note.md', note)
    expect(selectNoteById).toHaveBeenCalledWith('other.md')
  })

  it('reverts optimistic content changes when save fails', async () => {
    const storage = createStorageMock()
    const note = createNote()
    const selectedNoteFull = ref<Note | null>(note)
    const replaceNote = vi.fn()

    vi.mocked(storage.saveNote).mockRejectedValue(new Error('save failed'))

    const mutations = useNoteMutations({
      storage: computed(() => storage),
      catalogState: {
        notes: ref([note]),
        findNoteById: () => note,
        replaceNote,
        replaceRenamedNote: vi.fn(),
        prependNote: vi.fn(),
        updateNoteContent: vi.fn(() =>
          createNote({ content: 'Updated', description: 'Updated' }),
        ),
      },
      selectionState: {
        editorFlush: ref(null),
        selectedNote: selectedNoteFull,
        selectedNoteId: ref(note.id),
        selectedNoteFull,
        shouldFocusTitle: ref(false),
        selectNoteById: vi.fn(),
      },
      saveError: ref<string | null>(null),
      isRenamingNoteTitle: ref(false),
    })

    await mutations.saveSelectedNoteContent('Updated')

    expect(replaceNote).toHaveBeenCalledWith(note)
    expect(selectedNoteFull.value).toEqual(note)
  })
})
