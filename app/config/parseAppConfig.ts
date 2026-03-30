export type ApplicationType = 'desktop' | 'browser'

export type EditorColor = {
  emoji: string
  background: string
  label: string
}

export type EditorColors = Record<string, EditorColor>

export type AppConfig = {
  applicationType: ApplicationType
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

const VALID_APPLICATION_TYPES: ApplicationType[] = ['desktop', 'browser']
const EDITOR_COLOR_KEY_PATTERN = /^[A-Za-z0-9_-]+$/
const DEFAULT_EDITOR_COLORS: EditorColors = {
  red: {
    emoji: '🔴',
    background: '#F9EAE7',
    label: 'Red',
  },
  pink: {
    emoji: '🩷',
    background: '#F7EAF1',
    label: 'Pink',
  },
  green: {
    emoji: '🟢',
    background: '#EAF1EC',
    label: 'Green',
  },
  yellow: {
    emoji: '🟡',
    background: '#F8F3DE',
    label: 'Yellow',
  },
  blue: {
    emoji: '🔵',
    background: '#E7F2FB',
    label: 'Blue',
  },
  orange: {
    emoji: '🟠',
    background: '#F8ECDF',
    label: 'Orange',
  },
  purple: {
    emoji: '🟣',
    background: '#F2EBF8',
    label: 'Purple',
  },
  grey: {
    emoji: '⚪️',
    background: '#F0EFED',
    label: 'Grey',
  },
  brown: {
    emoji: '🟤',
    background: '#F4EDE9',
    label: 'Brown',
  },
}

export function parseEditorAssetsFolder(
  editor: Record<string, unknown>,
): string {
  const raw = editor.assetsFolder

  if (raw === undefined) {
    return 'assets'
  }

  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error(
      'Config editor.assetsFolder must be a non-empty string when set',
    )
  }

  const name = raw.trim()

  if (name.includes('/') || name.includes('\\')) {
    throw new Error(
      'Config editor.assetsFolder must be a single path segment (no slashes)',
    )
  }

  if (name === '.' || name === '..') {
    throw new Error('Config editor.assetsFolder must not be "." or ".."')
  }

  return name
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

    parsed[colorName] = {
      emoji,
      background,
      label,
    }
  }

  return parsed
}

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
  let pinned = true
  let nonDistractionMode = true
  let noteWebhook = true

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

    if (features.pinned !== undefined) {
      if (typeof features.pinned !== 'boolean') {
        throw new Error('Config features.pinned must be a boolean')
      }

      pinned = features.pinned
    }

    if (features.nonDistractionMode !== undefined) {
      if (typeof features.nonDistractionMode !== 'boolean') {
        throw new Error('Config features.nonDistractionMode must be a boolean')
      }

      nonDistractionMode = features.nonDistractionMode
    }

    if (features.noteWebhook !== undefined) {
      if (typeof features.noteWebhook !== 'boolean') {
        throw new Error('Config features.noteWebhook must be a boolean')
      }

      noteWebhook = features.noteWebhook
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
      assetsFolder: parseEditorAssetsFolder(editor),
    },
    layout: {
      showInspectorPanel: layout.showInspectorPanel as boolean,
      showSidebarPanel: layout.showSidebarPanel as boolean,
      showNotesListPanel: layout.showNotesListPanel as boolean,
    },
    theme: {
      accentColor: theme.accentColor as string,
    },
    editorColors: parseEditorColors(
      obj.editorColors ?? obj.editorBackgroundColors,
    ),
    features: {
      favorites,
      tasks,
      pinned,
      nonDistractionMode,
      noteWebhook,
    },
  }
}
