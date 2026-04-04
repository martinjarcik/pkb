import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useFolderMeta } from '~/composables/useFolderMeta'
import { useLayout } from '~/composables/useLayout'
import { useNotes } from '~/composables/useNotes'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'

export function useAppStartup() {
  const { loadError, loadNotes } = useNotes()
  const { loadFolders, selectInbox } = useSidebarNavigation()
  const { data: appConfigDisk, loadAppConfigDisk } = useAppConfigDisk()
  const { loadMeta } = useFolderMeta()
  const { syncLayoutFromConfig } = useLayout()

  async function startApp(): Promise<void> {
    try {
      await loadAppConfigDisk()
      syncLayoutFromConfig(appConfigDisk.value.layout)
      await Promise.all([loadNotes(), loadFolders(), loadMeta()])
      loadError.value = null
    } catch {
      await loadNotes()
      await Promise.all([loadFolders(), loadMeta()])
    }

    await selectInbox()
  }

  return { startApp }
}
