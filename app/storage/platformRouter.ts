import type { ApplicationType } from '~/config/loader'
import { httpPlatformApi } from './httpPlatformApi'
import type { PlatformApi } from './platformApi'

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
