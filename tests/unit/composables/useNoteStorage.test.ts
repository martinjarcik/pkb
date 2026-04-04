import { describe, expect, it, vi } from 'vitest'

const { appConfigData, platformApiMock, storageMock } = vi.hoisted(() => ({
  appConfigData: {
    value: {
      storageType: 'filesystem',
      vault: './vault',
      editor: {
        assetsFolder: 'assets',
      },
    },
  },
  platformApiMock: { kind: 'platform-api' },
  storageMock: { kind: 'note-storage' },
}))

vi.mock('~/composables/useAppConfigDisk', () => ({
  useAppConfigDisk: () => ({
    data: appConfigData,
  }),
}))

vi.mock('~/storage/platformRouter', () => ({
  getPlatformApi: vi.fn(() => platformApiMock),
}))

vi.mock('~/storage/router', () => ({
  getNoteStorage: vi.fn(() => storageMock),
}))

import { useNoteStorage } from '~/composables/useNoteStorage'

describe('useNoteStorage', () => {
  it('returns shared platformApi and storage refs across calls', () => {
    const first = useNoteStorage()
    const second = useNoteStorage()

    expect(first.platformApi).toBe(second.platformApi)
    expect(first.storage).toBe(second.storage)
    expect(first.platformApi.value).toBe(platformApiMock)
    expect(first.storage.value).toBe(storageMock)
  })
})
