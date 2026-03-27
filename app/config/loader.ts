import yaml from 'yaml'
import rawDefaultConfig from './default.yaml?raw'

export type ApplicationType = 'desktop' | 'browser'

export type AppConfig = {
  applicationType: ApplicationType
  locale: string
  vault: string
  notes: {
    trashRetentionDays: number
  }
  editor: {
    autosaveDelay: number
  }
  layout: {
    showInspectorPanel: boolean
    showSidebarPanel: boolean
    showNotesListPanel: boolean
  }
  theme: {
    accentColor: string
  }
  features: {
    favorites: boolean
    tasks: boolean
  }
}

const VALID_APPLICATION_TYPES: ApplicationType[] = ['desktop', 'browser']

export function parseAppConfig(value: unknown): AppConfig {
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

  if (typeof obj.locale !== 'string' || obj.locale.length === 0) {
    throw new Error('Config locale must be a non-empty string')
  }

  if (typeof obj.vault !== 'string' || obj.vault.length === 0) {
    throw new Error('Config vault must be a non-empty string')
  }

  if (typeof obj.notes !== 'object' || obj.notes === null) {
    throw new Error('Config notes must be an object')
  }

  const notes = obj.notes as Record<string, unknown>

  if (
    typeof notes.trashRetentionDays !== 'number' ||
    !Number.isInteger(notes.trashRetentionDays) ||
    notes.trashRetentionDays < 1
  ) {
    throw new Error(
      'Config notes.trashRetentionDays must be a positive integer',
    )
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

  if (typeof obj.theme !== 'object' || obj.theme === null) {
    throw new Error('Config theme must be an object')
  }

  const theme = obj.theme as Record<string, unknown>

  if (
    typeof theme.accentColor !== 'string' ||
    theme.accentColor.trim().length === 0
  ) {
    throw new Error('Config theme.accentColor must be a non-empty string')
  }

  let favorites = true
  let tasks = true

  if (obj.features !== undefined) {
    if (typeof obj.features !== 'object' || obj.features === null) {
      throw new Error('Config features must be an object')
    }

    const features = obj.features as Record<string, unknown>

    if (features.favorites !== undefined) {
      if (typeof features.favorites !== 'boolean') {
        throw new Error('Config features.favorites must be a boolean')
      }

      favorites = features.favorites
    }

    if (features.tasks !== undefined) {
      if (typeof features.tasks !== 'boolean') {
        throw new Error('Config features.tasks must be a boolean')
      }

      tasks = features.tasks
    }
  }

  return {
    applicationType: obj.applicationType as ApplicationType,
    locale: obj.locale as string,
    vault: obj.vault as string,
    notes: {
      trashRetentionDays: notes.trashRetentionDays as number,
    },
    editor: {
      autosaveDelay: editor.autosaveDelay as number,
    },
    layout: {
      showInspectorPanel: layout.showInspectorPanel as boolean,
      showSidebarPanel: layout.showSidebarPanel as boolean,
      showNotesListPanel: layout.showNotesListPanel as boolean,
    },
    theme: {
      accentColor: theme.accentColor as string,
    },
    features: {
      favorites,
      tasks,
    },
  }
}

const DEFAULT_CONFIG = parseAppConfig(yaml.parse(rawDefaultConfig) as unknown)

export function loadConfig(): AppConfig {
  return DEFAULT_CONFIG
}
