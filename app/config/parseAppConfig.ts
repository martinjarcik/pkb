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
    showInspectorPanel: boolean
    showSidebarPanel: boolean
    showNotesListPanel: boolean
  }
  theme: {
    accentColor: string
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
const EDITOR_COLOR_KEY_PATTERN = /^[A-Za-z0-9_-]+$/
const DEFAULT_EDITOR_COLORS: EditorColors = {
  red: {
    emoji: '🔴',
    background: '#F9EAE7',
    text: '#C0594E',
    label: 'Red',
  },
  pink: {
    emoji: '🩷',
    background: '#F7EAF1',
    text: '#EB445A',
    label: 'Pink',
  },
  mint: {
    emoji: '🟢',
    background: '#E6F6F4',
    text: '#5AC5B3',
    label: 'Mint',
  },
  yellow: {
    emoji: '🟡',
    background: '#F8F3DE',
    text: '#C39647',
    label: 'Yellow',
  },
  blue: {
    emoji: '🔵',
    background: '#E7F2FB',
    text: '#3B86F7',
    label: 'Blue',
  },
  orange: {
    emoji: '🟠',
    background: '#F8ECDF',
    text: '#F09343',
    label: 'Orange',
  },
  purple: {
    emoji: '🟣',
    background: '#F2EBF8',
    text: '#BB3ED9',
    label: 'Purple',
  },
  grey: {
    emoji: '⚪️',
    background: '#F0EFED',
    text: '#7C7A76',
    label: 'Grey',
  },
  brown: {
    emoji: '🟤',
    background: '#F4EDE9',
    text: '#99785E',
    label: 'Brown',
  },
}

function parseEditorAssetsFolder(editor: Record<string, unknown>): string {
  const raw = editor.assetsFolder

  if (raw === undefined) {
    return 'assets'
  }

  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error(
      'Config editor.assetsFolder must be a non-empty string when set',
    )
  }

  const path = raw.trim()
  const segments = path.split('/')

  for (const segment of segments) {
    if (
      segment.length === 0 ||
      segment === '.' ||
      segment === '..' ||
      segment.includes('\\')
    ) {
      throw new Error('Config editor.assetsFolder must be a safe relative path')
    }
  }

  return path
}

function parseEditorColors(value: unknown): EditorColors {
  if (value === undefined) {
    return DEFAULT_EDITOR_COLORS
  }

  if (typeof value !== 'object' || value === null) {
    throw new Error('Config editorColors must be an object')
  }

  const colors = value as Record<string, unknown>
  const parsed: EditorColors = {}
  const entries = Object.entries(colors)

  if (entries.length === 0) {
    throw new Error('Config editorColors must define at least one color')
  }

  for (const [colorName, rawColor] of entries) {
    if (colorName.trim().length === 0) {
      throw new Error('Config editorColors keys must be non-empty strings')
    }

    if (!EDITOR_COLOR_KEY_PATTERN.test(colorName)) {
      throw new Error(
        `Config editorColors.${colorName} uses an unsupported key; use letters, numbers, "-" or "_"`,
      )
    }

    if (typeof rawColor !== 'object' || rawColor === null) {
      throw new Error(`Config editorColors.${colorName} must be an object`)
    }

    const color = rawColor as Record<string, unknown>

    for (const key of ['emoji', 'label'] as const) {
      if (typeof color[key] === 'string' && color[key].trim().length > 0) {
        continue
      }

      throw new Error(
        `Config editorColors.${colorName}.${key} must be a non-empty string`,
      )
    }

    const emoji = color.emoji as string
    const background =
      typeof color.background === 'string' && color.background.trim().length > 0
        ? color.background
        : typeof color.hex === 'string' && color.hex.trim().length > 0
          ? color.hex
          : null
    const label = color.label as string

    if (!background) {
      throw new Error(
        `Config editorColors.${colorName}.background must be a non-empty string`,
      )
    }

    if (typeof color.text !== 'string' || color.text.trim().length === 0) {
      throw new Error(
        `Config editorColors.${colorName}.text must be a non-empty string`,
      )
    }

    const text = color.text as string

    parsed[colorName] = {
      emoji,
      background,
      text,
      label,
    }
  }

  return parsed
}

function parseNotesConfig(obj: Record<string, unknown>): AppConfig['notes'] {
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

  return {
    trashRetentionDays: notes.trashRetentionDays,
  }
}

function parseEditorConfig(obj: Record<string, unknown>): AppConfig['editor'] {
  if (typeof obj.editor !== 'object' || obj.editor === null) {
    throw new Error('Config editor must be an object')
  }

  const editor = obj.editor as Record<string, unknown>

  if (typeof editor.autosaveDelay !== 'number' || editor.autosaveDelay < 0) {
    throw new Error('Config editor.autosaveDelay must be a non-negative number')
  }

  return {
    autosaveDelay: editor.autosaveDelay,
    assetsFolder: parseEditorAssetsFolder(editor),
  }
}

function parseLayoutConfig(obj: Record<string, unknown>): AppConfig['layout'] {
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

  return {
    showInspectorPanel: layout.showInspectorPanel as boolean,
    showSidebarPanel: layout.showSidebarPanel as boolean,
    showNotesListPanel: layout.showNotesListPanel as boolean,
  }
}

function parseThemeConfig(obj: Record<string, unknown>): AppConfig['theme'] {
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

  const defaultEditorColor =
    typeof theme.defaultEditorColor === 'string' &&
    theme.defaultEditorColor.trim().length > 0
      ? theme.defaultEditorColor.trim()
      : 'yellow'

  return {
    accentColor: theme.accentColor,
    defaultEditorColor,
  }
}

function parseBooleanFlag(
  flags: Record<string, unknown>,
  key: keyof AppConfig['features'],
  defaultValue: boolean,
): boolean {
  const value = flags[key]

  if (value === undefined) {
    return defaultValue
  }

  if (typeof value !== 'boolean') {
    throw new Error(`Config features.${key} must be a boolean`)
  }

  return value
}

function parseFeaturesConfig(
  obj: Record<string, unknown>,
): AppConfig['features'] {
  if (obj.features !== undefined) {
    if (typeof obj.features !== 'object' || obj.features === null) {
      throw new Error('Config features must be an object')
    }
  }

  const features =
    obj.features === undefined ? {} : (obj.features as Record<string, unknown>)

  return {
    favorites: parseBooleanFlag(features, 'favorites', true),
    tasks: parseBooleanFlag(features, 'tasks', true),
    pinned: parseBooleanFlag(features, 'pinned', true),
    nonDistractionMode: parseBooleanFlag(features, 'nonDistractionMode', true),
    noteWebhook: parseBooleanFlag(features, 'noteWebhook', true),
  }
}

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
