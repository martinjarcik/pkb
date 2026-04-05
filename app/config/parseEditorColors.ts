import type { EditorColor, EditorColors } from './parseAppConfig'

const EDITOR_COLOR_KEY_PATTERN = /^[A-Za-z0-9_-]+$/

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
