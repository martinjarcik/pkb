import { resolve } from 'node:path'
import { createNoteCatalogRow } from '~/notes/catalogRow'
import type { Note, NoteCatalogRow } from '~/notes/types'
import { createFilesystemStorage } from '~/storage/filesystem'
import type {
  MoveNoteInput,
  NoteStorage,
  RenameNoteTitleInput,
  SaveNoteInput,
} from '~/storage/types'

type DesktopNoteCacheState = {
  baseStorage: NoteStorage
  byId: Map<string, Note>
  catalog: NoteCatalogRow[]
  folders: string[]
  isWarm: boolean
  warmupPromise: Promise<void> | null
}

const desktopStorageByVault = new Map<string, NoteStorage>()
const desktopCacheByVault = new Map<string, DesktopNoteCacheState>()

function cloneCatalogRow(row: NoteCatalogRow): NoteCatalogRow {
  return { ...row }
}

function cloneNote(note: Note): Note {
  return { ...note }
}

function buildCatalog(notes: Iterable<Note>): NoteCatalogRow[] {
  return [...notes]
    .sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt))
    .map((note) => createNoteCatalogRow(note))
}

async function loadCacheState(state: DesktopNoteCacheState): Promise<void> {
  const catalog = await state.baseStorage.loadNotesCatalog()
  const notes = await Promise.all(
    catalog.map(async (row) => state.baseStorage.loadNoteById(row.id)),
  )
  const byId = new Map<string, Note>()

  for (const note of notes) {
    if (note) {
      byId.set(note.id, note)
    }
  }

  state.byId = byId
  state.catalog = buildCatalog(byId.values())
  state.folders = await state.baseStorage.loadFolders()
  state.isWarm = true
}

async function ensureWarm(state: DesktopNoteCacheState): Promise<void> {
  if (state.isWarm) {
    return
  }

  if (!state.warmupPromise) {
    state.warmupPromise = loadCacheState(state).finally(() => {
      state.warmupPromise = null
    })
  }

  await state.warmupPromise
}

async function refreshFolders(state: DesktopNoteCacheState): Promise<void> {
  state.folders = await state.baseStorage.loadFolders()
}

function refreshCatalog(state: DesktopNoteCacheState): void {
  state.catalog = buildCatalog(state.byId.values())
}

function createCachedFilesystemStorage(vaultPath: string): NoteStorage {
  const baseStorage = createFilesystemStorage(vaultPath)
  const state: DesktopNoteCacheState = {
    baseStorage,
    byId: new Map<string, Note>(),
    catalog: [],
    folders: [],
    isWarm: false,
    warmupPromise: null,
  }

  desktopCacheByVault.set(vaultPath, state)

  return {
    async loadNotesCatalog(): Promise<NoteCatalogRow[]> {
      await ensureWarm(state)
      return state.catalog.map(cloneCatalogRow)
    },

    async loadFolders(): Promise<string[]> {
      await ensureWarm(state)
      return [...state.folders]
    },

    async loadNoteById(id: string): Promise<Note | null> {
      await ensureWarm(state)
      const note = state.byId.get(id)

      return note ? cloneNote(note) : null
    },

    async saveNote(input: SaveNoteInput): Promise<Note> {
      await ensureWarm(state)
      const saved = await state.baseStorage.saveNote(input)

      state.byId.set(saved.id, saved)
      refreshCatalog(state)
      await refreshFolders(state)

      return cloneNote(saved)
    },

    async renameNoteTitle(input: RenameNoteTitleInput): Promise<Note> {
      await ensureWarm(state)
      const renamed = await state.baseStorage.renameNoteTitle(input)

      state.byId.delete(input.id)
      state.byId.set(renamed.id, renamed)
      refreshCatalog(state)

      return cloneNote(renamed)
    },

    async moveNote(input: MoveNoteInput): Promise<Note> {
      await ensureWarm(state)
      const moved = await state.baseStorage.moveNote(input)

      state.byId.delete(input.id)
      state.byId.set(moved.id, moved)
      refreshCatalog(state)

      return cloneNote(moved)
    },

    async softDeleteNote(id: string): Promise<Note> {
      await ensureWarm(state)
      const trashed = await state.baseStorage.softDeleteNote(id)

      state.byId.set(trashed.id, trashed)
      refreshCatalog(state)

      return cloneNote(trashed)
    },

    async purgeExpiredTrashedNotes(
      retentionDays: number,
      now?: Date,
    ): Promise<void> {
      await ensureWarm(state)
      await state.baseStorage.purgeExpiredTrashedNotes(retentionDays, now)
      await loadCacheState(state)
    },

    async deleteNote(id: string): Promise<void> {
      await ensureWarm(state)
      await state.baseStorage.deleteNote(id)

      state.byId.delete(id)
      refreshCatalog(state)
    },

    async createFolder(name: string): Promise<void> {
      await ensureWarm(state)
      await state.baseStorage.createFolder(name)
      await refreshFolders(state)
    },

    async renameFolder(oldName: string, newName: string): Promise<void> {
      await ensureWarm(state)
      await state.baseStorage.renameFolder(oldName, newName)
      await loadCacheState(state)
    },
  }
}

export function getCachedFilesystemStorage(vaultPath: string): NoteStorage {
  const normalizedVaultPath = resolve(vaultPath)
  const existingStorage = desktopStorageByVault.get(normalizedVaultPath)

  if (existingStorage) {
    return existingStorage
  }

  const storage = createCachedFilesystemStorage(normalizedVaultPath)

  desktopStorageByVault.set(normalizedVaultPath, storage)

  return storage
}

export async function warmDesktopNoteCache(vaultPath: string): Promise<void> {
  const normalizedVaultPath = resolve(vaultPath)

  getCachedFilesystemStorage(normalizedVaultPath)

  const state = desktopCacheByVault.get(normalizedVaultPath)

  if (!state) {
    throw new Error(`Desktop note cache is unavailable for vault: ${vaultPath}`)
  }

  await ensureWarm(state)
}

export function resetDesktopNoteCacheForTests(): void {
  desktopStorageByVault.clear()
  desktopCacheByVault.clear()
}
