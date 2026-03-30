import { useAsyncData } from '#app'
import { loadConfig, type AppConfig } from '~/config/loader'

export function useAppConfigDisk() {
  return useAsyncData<AppConfig>(
    'app-config-disk',
    () => $fetch('/api/app-config'),
    {
      default: () => loadConfig(),
    },
  )
}
