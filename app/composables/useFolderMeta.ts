import type { FolderMeta, WorkspaceMeta } from '~/config/parseMeta'

export function useFolderMeta() {
  const meta = useState<WorkspaceMeta>('workspace.meta', () => ({
    folders: {},
  }))

  async function loadMeta(): Promise<void> {
    try {
      const data = await globalThis.$fetch<WorkspaceMeta>('/api/meta')

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
        ? { folders: { [folderName]: null } }
        : { folders: { [folderName]: { icon } as FolderMeta } }

    const updated = await globalThis.$fetch<WorkspaceMeta>('/api/meta', {
      method: 'PUT',
      body: patch,
    })

    meta.value = updated
  }

  return {
    meta,
    loadMeta,
    folderIcon,
    setFolderIcon,
  }
}
