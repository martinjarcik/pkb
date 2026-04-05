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
  it('derives platformApi and storage from current app config', () => {
    const first = useNoteStorage()
    const second = useNoteStorage()

    expect(first.platformApi.value).toBe(platformApiMock)
    expect(first.storage.value).toBe(storageMock)
    expect(second.platformApi.value).toBe(platformApiMock)
    expect(second.storage.value).toBe(storageMock)
  })
})
