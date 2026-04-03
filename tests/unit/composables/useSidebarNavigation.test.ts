import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'

const { loadExplicitFolders, stateStore } = vi.hoisted(() => ({
  loadExplicitFolders: vi.fn<() => Promise<string[]>>().mockResolvedValue([]),
  stateStore: new Map<string, { value: unknown }>(),
}))

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
          assetsFolder: 'assets',
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
      },
    }),
  }),
}))

describe('useSidebarNavigation', () => {
  it('includes folder names persisted in workspace meta', async () => {
    stateStore.clear()
    const { loadFolders, topLevelFolders } = useSidebarNavigation()

    await loadFolders()

    expect(topLevelFolders.value).toEqual(['Projects'])
  })
})
