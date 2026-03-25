import yaml from 'yaml'
import rawDefaultConfig from './default.yaml?raw'

export type ApplicationType = 'desktop' | 'browser'

export type AppConfig = {
  applicationType: ApplicationType
  vault: string
  editor: {
    autosaveDelay: number
  }
  layout: {
    showInspectorPanel: boolean
    showSidebarPanel: boolean
    showNotesListPanel: boolean
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

  if (typeof obj.editor !== 'object' || obj.editor === null) {
    throw new Error('Config editor must be an object')
  }

  const editor = obj.editor as Record<string, unknown>

  if (typeof editor.autosaveDelay !== 'number' || editor.autosaveDelay < 0) {
    throw new Error('Config editor.autosaveDelay must be a non-negative number')
  }

  if (typeof obj.layout !== 'object' || obj.layout === null) {
    throw new Error('Config layout must be an object')
  }

  const layout = obj.layout as Record<string, unknown>

  for (const key of [
    'showInspectorPanel',
    'showSidebarPanel',
    'showNotesListPanel',
  ] as const) {
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
