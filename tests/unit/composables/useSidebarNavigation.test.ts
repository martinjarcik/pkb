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
          .mockResolvedValue(['Keep', 'Projects', 'assets']),
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
  it('lists vault directories after loading and excludes the configured assets folder', async () => {
    const { topLevelFolders, loadVaultFolders } = useSidebarNavigation()

    expect(topLevelFolders.value).toEqual([])

    await loadVaultFolders()

    expect(topLevelFolders.value).toEqual(['Keep', 'Projects'])
  })
})
