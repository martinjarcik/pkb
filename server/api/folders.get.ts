import { defineEventHandler } from 'h3'
import { getServerNoteStorage } from '../getServerNoteStorage'
import { loadServerConfig } from '../loadServerConfig'

export default defineEventHandler(async () => {
  const config = await loadServerConfig()
  const storage = getServerNoteStorage(config)
  const folders = await storage.loadFolders()

  return folders.filter((name) => name !== config.assetsFolder)
})
