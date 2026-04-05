import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useFolderMeta } from '~/composables/useFolderMeta'
import { useLayout } from '~/composables/useLayout'
import { useNotes } from '~/composables/useNotes'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'

/** Coordinates app bootstrap across config, notes, metadata, and navigation state. */
export function useAppStartup() {
  const { loadError, loadNotes } = useNotes()
  const { selectInbox } = useSidebarNavigation()
  const { data: appConfigDisk, loadAppConfigDisk } = useAppConfigDisk()
  const { loadMeta } = useFolderMeta()
  const { syncLayoutFromConfig } = useLayout()

  async function startApp(): Promise<void> {
    try {
      await loadAppConfigDisk()
      syncLayoutFromConfig(appConfigDisk.value.layout)
      await Promise.all([loadNotes(), loadMeta()])
      loadError.value = null
    } catch {
      await loadNotes()
      await loadMeta()
    }

    await selectInbox()
  }

  return { startApp }
}
