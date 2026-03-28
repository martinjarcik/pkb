import { defineEventHandler } from 'h3'
import { getNoteStorage } from '~/storage/router'
import { loadServerConfig } from '../loadServerConfig'

export default defineEventHandler(async () => {
  const config = await loadServerConfig()
  const storage = getNoteStorage(config)
  const folders = await storage.loadFolders()

  return folders.filter((name) => name !== config.assetsFolder)
})
