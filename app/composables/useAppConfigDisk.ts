import { useState } from '#app'
import { loadConfig, type AppConfig } from '~/config/loader'

export function useAppConfigDisk() {
  const data = useState<AppConfig>('app-config-disk', () => loadConfig())

  async function loadAppConfigDisk(): Promise<void> {
    try {
      data.value = await $fetch<AppConfig>('/api/app-config')
    } catch {
      data.value = loadConfig()
    }
  }

  return {
    data,
    loadAppConfigDisk,
  }
}
