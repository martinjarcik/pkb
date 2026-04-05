import type { EditorColor, EditorColors } from './parseAppConfig'

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

function parseEditorColor(colorName: string, rawColor: unknown): EditorColor {
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
    if (typeof color[key] !== 'string' || color[key].trim().length === 0) {
      throw new Error(
        `Config editorColors.${colorName}.${key} must be a non-empty string`,
      )
    }
  }

  const background =
    typeof color.background === 'string' && color.background.trim().length > 0
      ? color.background
      : typeof color.hex === 'string' && color.hex.trim().length > 0
        ? color.hex
        : null

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

  return {
    emoji: color.emoji as string,
    background,
    text: color.text as string,
    label: color.label as string,
  }
}

export function parseEditorColors(value: unknown): EditorColors {
  if (value === undefined) {
    return DEFAULT_EDITOR_COLORS
  }

  if (typeof value !== 'object' || value === null) {
    throw new Error('Config editorColors must be an object')
  }

  const entries = Object.entries(value as Record<string, unknown>)

  if (entries.length === 0) {
    throw new Error('Config editorColors must define at least one color')
  }

  return Object.fromEntries(
    entries.map(([colorName, rawColor]) => [
      colorName,
      parseEditorColor(colorName, rawColor),
    ]),
  )
}
