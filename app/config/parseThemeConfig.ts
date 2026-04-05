import type { AppConfig, EditorColors } from './parseAppConfig'

export function parseThemeConfig(
  obj: Record<string, unknown>,
  editorColors: EditorColors,
): AppConfig['theme'] {
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
  const sidebarBackgroundColor =
    typeof theme.sidebarBackgroundColor === 'string' &&
    theme.sidebarBackgroundColor.trim().length > 0
      ? theme.sidebarBackgroundColor.trim()
      : '#fafafa'
  const sidebarTextColor =
    typeof theme.sidebarTextColor === 'string' &&
    theme.sidebarTextColor.trim().length > 0
      ? theme.sidebarTextColor.trim()
      : '#444444'

  if (!(defaultEditorColor in editorColors)) {
    throw new Error(
      `Config theme.defaultEditorColor must match an editorColors key: ${defaultEditorColor}`,
    )
  }

  return {
    accentColor: theme.accentColor,
    sidebarBackgroundColor,
    sidebarTextColor,
    defaultEditorColor,
  }
}
