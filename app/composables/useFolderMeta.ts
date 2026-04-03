import { useState } from '#app'
import {
  readMetaPersistence,
  writeMetaPatchPersistence,
} from '~/config/persistence'
import type { FolderMeta, WorkspaceMeta } from '~/config/parseMeta'
import { getPlatformApi } from '~/storage/platformRouter'

export function useFolderMeta() {
  const meta = useState<WorkspaceMeta>('workspace.meta', () => ({
    folders: {},
  }))
  const { data: appConfigDisk } = useAppConfigDisk()

  async function loadMeta(): Promise<void> {
    try {
      const data = await readMetaPersistence(
        appConfigDisk.value.storageType,
        getPlatformApi(appConfigDisk.value.storageType),
      )

      meta.value = data
    } catch {
      meta.value = { folders: {} }
    }
  }

  function folderIcon(folderName: string): string | undefined {
    return meta.value.folders[folderName]?.icon
  }

  async function removeFolderMeta(folderName: string): Promise<void> {
    meta.value = await writeMetaPatchPersistence(
      appConfigDisk.value.storageType,
      getPlatformApi(appConfigDisk.value.storageType),
      { folders: { [folderName]: null } },
    )
  }

  async function setFolderIcon(
    folderName: string,
    icon: string | undefined,
  ): Promise<void> {
    const patch: Record<string, unknown> =
      icon === undefined || icon === ''
        ? { folders: { [folderName]: {} } }
        : { folders: { [folderName]: { icon } as FolderMeta } }

    meta.value = await writeMetaPatchPersistence(
      appConfigDisk.value.storageType,
      getPlatformApi(appConfigDisk.value.storageType),
      patch,
    )
  }

  async function renameFolderMeta(
    oldName: string,
    newName: string,
  ): Promise<void> {
    const nextMeta = meta.value.folders[oldName] ?? {}

    meta.value = await writeMetaPatchPersistence(
      appConfigDisk.value.storageType,
      getPlatformApi(appConfigDisk.value.storageType),
      {
        folders: {
          [newName]: nextMeta,
          [oldName]: null,
        },
      },
    )
  }

  return {
    meta,
    loadMeta,
    folderIcon,
    removeFolderMeta,
    renameFolderMeta,
    setFolderIcon,
  }
}
