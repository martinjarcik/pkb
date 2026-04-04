import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'

const { loadExplicitFolders } = vi.hoisted(() => ({
  loadExplicitFolders: vi.fn<() => Promise<string[]>>().mockResolvedValue([]),
}))

vi.mock('~/composables/useTranslations', () => ({
  t: (key: string) => key,
}))

vi.mock('~/composables/useNotes', () => ({
  useNotes: () => ({
    catalog: ref([]),
    allNotes: ref([]),
    selectedNoteId: ref<string | null>(null),
    selectNoteById: vi.fn(),
  }),
}))

vi.mock('~/composables/useNoteStorage', () => ({
  useNoteStorage: () => ({
    storage: {
      value: {
        loadExplicitFolders,
        createFolder: vi.fn(),
        renameFolder: vi.fn(),
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

vi.mock('~/composables/useFolderMeta', () => ({
  useFolderMeta: () => ({
    meta: ref({
      folders: {
        Projects: {},
        assets: {},
        Keep: {},
      },
    }),
  }),
}))

describe('useSidebarNavigation', () => {
  it('includes folder names persisted in workspace meta', async () => {
    const { loadFolders, topLevelFolders } = useSidebarNavigation()

    await loadFolders()

    expect(topLevelFolders.value).toEqual(['Keep', 'Projects'])
  })
})
