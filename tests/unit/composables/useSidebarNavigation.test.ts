import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'

vi.mock('~/composables/useTranslations', () => ({
  t: (key: string) => key,
}))

vi.mock('~/composables/useNotes', () => ({
  useNotes: () => ({
    notes: ref([]),
    allNotes: ref([]),
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
  it('includes folder names persisted in workspace meta', () => {
    const { topLevelFolders } = useSidebarNavigation()

    expect(topLevelFolders.value).toEqual(['Keep', 'Projects'])
  })
})
