import { createApp } from 'vue'
import App from './AppRoot.vue'
import './assets/css/main.css'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useFontLoader } from '~/composables/useFontLoader'

async function bootstrap(): Promise<void> {
  const { data: appConfigDisk, loadAppConfigDisk } = useAppConfigDisk()
  const { ensureApplicationFontLoaded, ensureSidebarBadgeFontLoaded } =
    useFontLoader()

  await loadAppConfigDisk()

  await Promise.all([
    ensureApplicationFontLoaded(
      appConfigDisk.value.theme.typography.application.typeface,
    ),
    ensureSidebarBadgeFontLoaded(appConfigDisk.value.theme.sidebarBadge),
  ])

  document.documentElement.style.fontFamily =
    appConfigDisk.value.theme.typography.application.typeface
  document.documentElement.style.fontSize =
    appConfigDisk.value.theme.typography.application.fontSize

  createApp(App).mount('#app')
}

void bootstrap()
