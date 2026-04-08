import { resetAppPersistence } from '~/config/persistence'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useAppStartup } from '~/composables/useAppStartup'
import { useFolderMeta } from '~/composables/useFolderMeta'
import { useLayout } from '~/composables/useLayout'
import { useOnboarding } from '~/composables/useOnboarding'
import { getPlatformApi } from '~/storage/platformRouter'

export function useAppReset() {
  const { data: appConfigDisk } = useAppConfigDisk()
  const { meta } = useFolderMeta()
  const { state: onboardingState, loadOnboarding } = useOnboarding()
  const { startApp } = useAppStartup()
  const { syncLayoutFromConfig } = useLayout()

  async function resetApp(): Promise<void> {
    const currentConfig = appConfigDisk.value
    const platformApi = getPlatformApi(
      currentConfig.storageType,
      currentConfig.vault,
      currentConfig.editor.assetsFolder,
    )
    const resetState = await resetAppPersistence(platformApi)

    appConfigDisk.value = resetState.appConfig
    onboardingState.value = resetState.onboarding
    meta.value = resetState.meta
    syncLayoutFromConfig(resetState.appConfig.layout)
    await startApp()
    await loadOnboarding()
  }

  return {
    resetApp,
  }
}
