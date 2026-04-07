import type { AppConfig, EditorColors } from './parseAppConfig'

const DEFAULT_APPLICATION_TYPEFACE =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const DEFAULT_APPLICATION_FONT_SIZE = '16px'
const DEFAULT_EDITOR_TYPEFACE =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const DEFAULT_EDITOR_FONT_SIZE = '14px'
const DEFAULT_SIDEBAR_BADGE = '🦄'

function parseTypographyValue(
  value: unknown,
  fallback: string,
  label: string,
): string {
  if (value === undefined) {
    return fallback
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Config ${label} must be a non-empty string`)
  }

  return value.trim()
}

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
  const sidebarBadge =
    typeof theme.sidebarBadge === 'string'
      ? theme.sidebarBadge.trim()
      : DEFAULT_SIDEBAR_BADGE
  const typography =
    typeof theme.typography === 'object' && theme.typography !== null
      ? (theme.typography as Record<string, unknown>)
      : {}
  const applicationTypography =
    typeof typography.application === 'object' &&
    typography.application !== null
      ? (typography.application as Record<string, unknown>)
      : {}
  const editorTypography =
    typeof typography.editor === 'object' && typography.editor !== null
      ? (typography.editor as Record<string, unknown>)
      : {}
  const applicationTypeface = parseTypographyValue(
    applicationTypography.typeface,
    DEFAULT_APPLICATION_TYPEFACE,
    'theme.typography.application.typeface',
  )
  const applicationFontSize = parseTypographyValue(
    applicationTypography.fontSize,
    DEFAULT_APPLICATION_FONT_SIZE,
    'theme.typography.application.fontSize',
  )
  const editorTypeface = parseTypographyValue(
    editorTypography.typeface,
    DEFAULT_EDITOR_TYPEFACE,
    'theme.typography.editor.typeface',
  )
  const editorFontSize = parseTypographyValue(
    editorTypography.fontSize,
    DEFAULT_EDITOR_FONT_SIZE,
    'theme.typography.editor.fontSize',
  )

  if (!(defaultEditorColor in editorColors)) {
    throw new Error(
      `Config theme.defaultEditorColor must match an editorColors key: ${defaultEditorColor}`,
    )
  }

  return {
    accentColor: theme.accentColor,
    sidebarBackgroundColor,
    sidebarTextColor,
    sidebarBadge,
    defaultEditorColor,
    typography: {
      application: {
        typeface: applicationTypeface,
        fontSize: applicationFontSize,
      },
      editor: {
        typeface: editorTypeface,
        fontSize: editorFontSize,
      },
    },
  }
}
