import { computed, ref } from 'vue'
import { loadConfig } from '~/config/loader'
import {
  readOnboardingPersistence,
  writeOnboardingPersistence,
} from '~/config/persistence'
import type {
  OnboardingSlide,
  OnboardingState,
} from '~/config/parseOnboardingState'
import { DEFAULT_ONBOARDING_STATE } from '~/config/parseOnboardingState'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import { useAppStartup } from '~/composables/useAppStartup'
import { getPlatformApi } from '~/storage/platformRouter'

export type OnboardingStorageSelection =
  | { kind: 'default'; defaultVault: string }
  | { kind: 'custom'; vault: string }
  | { kind: 'icloud'; vault: string }

const state = ref<OnboardingState>(DEFAULT_ONBOARDING_STATE)
const isLoaded = ref(false)

export function nextOnboardingSlide(
  currentSlide: OnboardingSlide,
): OnboardingSlide {
  if (currentSlide >= 5) {
    return 5
  }

  return (currentSlide + 1) as OnboardingSlide
}

export function buildOnboardingStoragePatch(
  selection: OnboardingStorageSelection,
): { storageType: 'filesystem'; vault: string } {
  switch (selection.kind) {
    case 'default':
      return {
        storageType: 'filesystem',
        vault: selection.defaultVault,
      }
    case 'custom':
    case 'icloud':
      return {
        storageType: 'filesystem',
        vault: selection.vault,
      }
  }
}

export function onboardingStateAfterImport(
  currentState: OnboardingState,
  succeeded: boolean,
  pluginId?: string,
): OnboardingState {
  return {
    ...currentState,
    currentSlide: succeeded ? 4 : 3,
    selectedImportPluginId: pluginId ?? currentState.selectedImportPluginId,
  }
}

export function onboardingStateAfterFinish(
  currentState: OnboardingState,
): OnboardingState {
  if (currentState.currentSlide !== 5) {
    return currentState
  }

  return {
    ...currentState,
    completed: true,
    currentSlide: 5,
  }
}

export function useOnboarding() {
  const defaultVaultPath = loadConfig().vault
  const { data: appConfigDisk, saveAppConfigPatch } = useAppConfigDisk()
  const { startApp } = useAppStartup()

  const onboardingOpen = computed(() => {
    return isLoaded.value && !state.value.completed
  })

  function onboardingPlatformApi() {
    return getPlatformApi(
      appConfigDisk.value.storageType,
      appConfigDisk.value.vault,
      appConfigDisk.value.editor.assetsFolder,
    )
  }

  async function persist(nextState: OnboardingState): Promise<OnboardingState> {
    const saved = await writeOnboardingPersistence(
      onboardingPlatformApi(),
      nextState,
    )
    state.value = saved
    return saved
  }

  async function loadOnboarding(): Promise<void> {
    state.value = await readOnboardingPersistence(onboardingPlatformApi())
    isLoaded.value = true
  }

  async function goToSlide(nextSlide: OnboardingSlide): Promise<void> {
    if (state.value.completed) {
      return
    }

    await persist({
      ...state.value,
      currentSlide: nextSlide,
    })
  }

  async function goToNextSlide(): Promise<void> {
    await goToSlide(nextOnboardingSlide(state.value.currentSlide))
  }

  async function saveStorageSelection(
    selection: OnboardingStorageSelection,
  ): Promise<void> {
    const patch = buildOnboardingStoragePatch(selection)

    if (patch.vault === appConfigDisk.value.vault) {
      return
    }

    await saveAppConfigPatch(patch)
    await startApp()
  }

  async function saveAccentColor(color: string): Promise<void> {
    if (color === appConfigDisk.value.theme.accentColor) {
      return
    }

    await saveAppConfigPatch({ theme: { accentColor: color } })
  }

  async function saveSidebarBadge(sidebarBadge: string): Promise<void> {
    if (sidebarBadge === appConfigDisk.value.theme.sidebarBadge) {
      return
    }

    await saveAppConfigPatch({ theme: { sidebarBadge } })
  }

  async function setSelectedImportPluginId(
    selectedImportPluginId?: string,
  ): Promise<void> {
    await persist({
      ...state.value,
      selectedImportPluginId:
        selectedImportPluginId && selectedImportPluginId.length > 0
          ? selectedImportPluginId
          : undefined,
    })
  }

  async function handleImportResult(
    succeeded: boolean,
    pluginId?: string,
  ): Promise<void> {
    await persist(onboardingStateAfterImport(state.value, succeeded, pluginId))
  }

  async function finishOnboarding(): Promise<void> {
    await persist(onboardingStateAfterFinish(state.value))
  }

  return {
    state,
    isLoaded,
    onboardingOpen,
    defaultVaultPath,
    loadOnboarding,
    goToSlide,
    goToNextSlide,
    saveStorageSelection,
    saveAccentColor,
    saveSidebarBadge,
    setSelectedImportPluginId,
    handleImportResult,
    finishOnboarding,
  }
}
