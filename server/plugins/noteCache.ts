import { defineNitroPlugin } from 'nitropack/runtime'
import { loadServerConfig } from '../loadServerConfig'
import { warmDesktopNoteCache } from '../noteCache'

export default defineNitroPlugin(async () => {
  const config = await loadServerConfig()

  if (config.applicationType !== 'desktop') {
    return
  }

  await warmDesktopNoteCache(config.vault)
})
