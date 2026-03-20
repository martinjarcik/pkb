import yaml from 'yaml'
import rawDefaultConfig from './default.yaml?raw'

export type ApplicationType = 'desktop' | 'browser'

export type AppConfig = {
  applicationType: ApplicationType
  vault: string
  layout: {
    showInspector: boolean
    showSidebar: boolean
    showNoteList: boolean
  }
}

const VALID_APPLICATION_TYPES: ApplicationType[] = ['desktop', 'browser']

function assertAppConfig(value: unknown): AppConfig {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Config must be an object')
  }

  const obj = value as Record<string, unknown>

  if (
    !VALID_APPLICATION_TYPES.includes(obj.applicationType as ApplicationType)
  ) {
    throw new Error(
      `Config applicationType must be one of: ${VALID_APPLICATION_TYPES.join(', ')}`,
    )
  }

  if (typeof obj.vault !== 'string' || obj.vault.length === 0) {
    throw new Error('Config vault must be a non-empty string')
  }

  if (typeof obj.layout !== 'object' || obj.layout === null) {
    throw new Error('Config layout must be an object')
  }

  const layout = obj.layout as Record<string, unknown>

  for (const key of ['showInspector', 'showSidebar', 'showNoteList'] as const) {
    if (typeof layout[key] !== 'boolean') {
      throw new Error(`Config layout.${key} must be a boolean`)
    }
  }

  return value as AppConfig
}

const DEFAULT_CONFIG = assertAppConfig(yaml.parse(rawDefaultConfig) as unknown)

export function loadConfig(): AppConfig {
  return DEFAULT_CONFIG
}
