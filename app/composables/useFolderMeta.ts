import { ref } from 'vue'
import {
  readMetaPersistence,
  writeMetaPatchPersistence,
} from '~/config/persistence'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import type { FolderMeta, WorkspaceMeta } from '~/config/parseMeta'
import { getPlatformApi } from '~/storage/platformRouter'

const meta = ref<WorkspaceMeta>({
  folders: {},
})

export function useFolderMeta() {
  const { data: appConfigDisk } = useAppConfigDisk()

  async function loadMeta(): Promise<void> {
    try {
      const data = await readMetaPersistence(
        getPlatformApi(
          appConfigDisk.value.storageType,
          appConfigDisk.value.vault,
          appConfigDisk.value.editor.assetsFolder,
        ),
      )

      meta.value = data
    } catch {
      meta.value = { folders: {} }
    }
  }

  function folderIcon(folderName: string): string | undefined {
    return meta.value.folders[folderName]?.icon
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
      getPlatformApi(
        appConfigDisk.value.storageType,
        appConfigDisk.value.vault,
        appConfigDisk.value.editor.assetsFolder,
      ),
      patch,
    )
  }

  async function renameFolderMeta(
    oldName: string,
    newName: string,
  ): Promise<void> {
    const nextMeta = meta.value.folders[oldName] ?? {}

    meta.value = await writeMetaPatchPersistence(
      getPlatformApi(
        appConfigDisk.value.storageType,
        appConfigDisk.value.vault,
        appConfigDisk.value.editor.assetsFolder,
      ),
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
    renameFolderMeta,
    setFolderIcon,
  }
}
