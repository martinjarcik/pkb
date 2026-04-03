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
