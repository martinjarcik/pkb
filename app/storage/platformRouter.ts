import type { ApplicationType } from '~/config/loader'
import { httpPlatformApi } from './httpPlatformApi'
import type { PlatformApi } from './platformApi'

type TauriWindow = Window & {
  __TAURI_INTERNALS__?: unknown
}

export function detectApplicationType(): ApplicationType | null {
  if (typeof window === 'undefined') {
    return null
  }

  return '__TAURI_INTERNALS__' in (window as TauriWindow) ? 'desktop' : null
}

export function getPlatformApi(
  applicationType: ApplicationType,
): PlatformApi | null {
  switch (applicationType) {
    case 'browser':
      return null
    case 'desktop':
      return httpPlatformApi
    default:
      throw new Error(
        `Unsupported application type: ${applicationType as string}`,
      )
  }
}
