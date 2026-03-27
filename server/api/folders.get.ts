import { defineEventHandler } from 'h3'
import { getNoteStorage } from '~/storage/router'
import { loadServerConfig } from '../loadServerConfig'

export default defineEventHandler(async () => {
  const storage = getNoteStorage(await loadServerConfig())

  return storage.loadFolders()
})
