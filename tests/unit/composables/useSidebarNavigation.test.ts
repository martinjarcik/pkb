import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'

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
      value: {
        createFolder: vi.fn(),
        renameFolder: vi.fn(),
        loadFolderNames: vi
          .fn()
          .mockResolvedValue([
            'Keep',
            'Keep/Archive',
            'Projects',
            'Projects/Work',
            'assets',
            'assets/images',
          ]),
      },
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
  it('lists vault directories after loading and excludes the configured assets folder tree', async () => {
    const { allFolderPaths, loadVaultFolders } = useSidebarNavigation()

    expect(allFolderPaths.value).toEqual([])

    await loadVaultFolders()

    expect(allFolderPaths.value).toEqual([
      'Keep',
      'Keep/Archive',
      'Projects',
      'Projects/Work',
    ])
  })
})
