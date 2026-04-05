import { parseEditorColors } from './parseEditorColors'
import { parseEditorConfig } from './parseEditorConfig'
import { parseFeaturesConfig } from './parseFeaturesConfig'
import { parseLayoutConfig } from './parseLayoutConfig'
import { parseNotesConfig } from './parseNotesConfig'
import { parseThemeConfig } from './parseThemeConfig'

export type StorageType = 'filesystem'

export type EditorColor = {
  emoji: string
  background: string
  text: string
  label: string
}

export type EditorColors = Record<string, EditorColor>

export type AppConfig = {
  storageType: StorageType
  locale: string
  vault: string
  notes: {
    trashRetentionDays: number
  }
  editor: {
    autosaveDelay: number
    assetsFolder: string
  }
  layout: {
    showSidebarPanel: boolean
    showNotesListPanel: boolean
  }
  theme: {
    accentColor: string
    sidebarBackgroundColor: string
    sidebarTextColor: string
    defaultEditorColor: string
  }
  editorColors: EditorColors
  features: {
    favorites: boolean
    tasks: boolean
    pinned: boolean
    nonDistractionMode: boolean
    noteWebhook: boolean
  }
}

const VALID_STORAGE_TYPES: StorageType[] = ['filesystem']

export function parseAppConfig(value: unknown): AppConfig {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Config must be an object')
  }

  const obj = value as Record<string, unknown>

  if (!VALID_STORAGE_TYPES.includes(obj.storageType as StorageType)) {
    throw new Error(
      `Config storageType must be one of: ${VALID_STORAGE_TYPES.join(', ')}`,
    )
  }

  if (typeof obj.locale !== 'string' || obj.locale.length === 0) {
    throw new Error('Config locale must be a non-empty string')
  }

  if (typeof obj.vault !== 'string' || obj.vault.length === 0) {
    throw new Error('Config vault must be a non-empty string')
  }

  return {
    storageType: obj.storageType as StorageType,
    locale: obj.locale as string,
    vault: obj.vault as string,
    notes: parseNotesConfig(obj),
    editor: parseEditorConfig(obj),
    layout: parseLayoutConfig(obj),
    theme: parseThemeConfig(obj),
    editorColors: parseEditorColors(obj.editorColors),
    features: parseFeaturesConfig(obj),
  }
}
