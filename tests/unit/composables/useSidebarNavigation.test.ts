import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'

const { storageMock } = vi.hoisted(() => ({
  storageMock: {
    createFolder: vi.fn(),
    renameFolder: vi.fn().mockResolvedValue(undefined),
    loadFolderNames: vi.fn().mockResolvedValue([]),
  },
}))

const vaultFolders = [
  'Keep',
  'Keep/Archive',
  'Projects',
  'Projects/Work',
  'assets',
  'assets/images',
]

vi.mock('~/composables/useTranslations', () => ({
  t: (key: string) => key,
}))

vi.mock('~/composables/useNoteCatalog', () => ({
  useNoteCatalog: () => ({
    notes: ref([]),
    allNotes: ref([]),
    findNoteById: vi.fn(),
  }),
}))

vi.mock('~/composables/useNoteSelection', () => ({
  useNoteSelection: () => ({
    selectedNoteId: ref<string | null>(null),
    selectNoteById: vi.fn(),
  }),
}))

vi.mock('~/composables/useNoteStorage', () => ({
  useNoteStorage: () => ({
    storage: {
      value: storageMock,
    },
  }),
}))

vi.mock('~/composables/useAppConfigDisk', () => ({
  useAppConfigDisk: () => ({
    data: {
      value: {
        editor: {
          assetsFolder: 'assets/images',
        },
      },
    },
  }),
}))

describe('useSidebarNavigation', () => {
  beforeEach(async () => {
    vi.mocked(storageMock.renameFolder).mockReset().mockResolvedValue(undefined)
    vi.mocked(storageMock.loadFolderNames).mockReset().mockResolvedValue([])

    const sidebar = useSidebarNavigation()
    sidebar.selectedView.value = { kind: 'inbox' }
    sidebar.searchInput.value = ''
    await sidebar.loadVaultFolders()
  })

  it('lists vault directories after loading and excludes the configured assets folder tree', async () => {
    const { allFolderPaths, loadVaultFolders } = useSidebarNavigation()

    expect(allFolderPaths.value).toEqual([])

    vi.mocked(storageMock.loadFolderNames).mockResolvedValue(vaultFolders)
    await loadVaultFolders()

    expect(allFolderPaths.value).toEqual([
      'Keep',
      'Keep/Archive',
      'Projects',
      'Projects/Work',
    ])
  })

  it('updates the visible folder paths immediately after renaming a parent folder', async () => {
    const { allFolderPaths, loadVaultFolders, renameFolder } =
      useSidebarNavigation()

    vi.mocked(storageMock.loadFolderNames).mockResolvedValue(vaultFolders)
    await loadVaultFolders()
    const result = await renameFolder('Projects', 'Clients')

    expect(result).toEqual({ ok: true, folderPath: 'Clients' })
    expect(allFolderPaths.value).toEqual([
      'Clients',
      'Clients/Work',
      'Keep',
      'Keep/Archive',
    ])
  })

  it('retargets the selected folder view when a parent folder is renamed', async () => {
    const { loadVaultFolders, renameFolder, selectFolder, selectedView } =
      useSidebarNavigation()

    vi.mocked(storageMock.loadFolderNames).mockResolvedValue(vaultFolders)
    await loadVaultFolders()
    await selectFolder('Projects/Work')
    await renameFolder('Projects', 'Clients')

    expect(selectedView.value).toEqual({
      kind: 'folder',
      folderPath: 'Clients/Work',
    })
  })
})
