import { useState } from '#app'
import {
  readAppConfigPersistence,
  writeAppConfigPatchPersistence,
} from '~/config/persistence'
import { detectApplicationType, getPlatformApi } from '~/storage/platformRouter'
import {
  loadConfig,
  type AppConfig,
  type ApplicationType,
} from '~/config/loader'

const APPLICATION_TYPE_BOOTSTRAP_KEY = 'pkb:application-type'

function getLocalStorage(): Storage | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  return localStorage
}

function readStoredApplicationType(): ApplicationType | null {
  const stored = getLocalStorage()?.getItem(APPLICATION_TYPE_BOOTSTRAP_KEY)

  return stored === 'browser' || stored === 'desktop' ? stored : null
}

function writeStoredApplicationType(applicationType: ApplicationType): void {
  getLocalStorage()?.setItem(APPLICATION_TYPE_BOOTSTRAP_KEY, applicationType)
}

export function useAppConfigDisk() {
  const data = useState<AppConfig>('app-config-disk', () => loadConfig())

  async function loadAppConfigDisk(): Promise<void> {
    try {
      const applicationType = resolveReadApplicationType()

      data.value = await readAppConfigPersistence(
        applicationType,
        getPlatformApi(applicationType),
      )
      writeStoredApplicationType(data.value.applicationType)
    } catch {
      data.value = loadConfig()
    }
  }

  async function saveAppConfigPatch(
    patch: Record<string, unknown>,
  ): Promise<AppConfig> {
    const updated = await writeAppConfigPatchPersistence(
      data.value.applicationType,
      getPlatformApi(data.value.applicationType),
      patch,
    )

    data.value = updated
    writeStoredApplicationType(updated.applicationType)

    return updated
  }

  function resolveReadApplicationType(): ApplicationType {
    return (
      detectApplicationType() ??
      readStoredApplicationType() ??
      loadConfig().applicationType
    )
  }

  return {
    data,
    loadAppConfigDisk,
    saveAppConfigPatch,
  }
}
