import { loadConfig } from '~/config/loader'
import type {
  AppConfig,
  EditorColor,
  EditorColors,
} from '~/config/parseAppConfig'

const defaultConfig = loadConfig()
let editorColors = defaultConfig.editorColors
let defaultEditorColor = defaultConfig.theme.defaultEditorColor

// The app shell synchronizes runtime editor colors into this module so the
// Editor.js helpers can stay independent from composable state.
export function syncEditorColors(
  config: Pick<AppConfig, 'editorColors' | 'theme'>,
): void {
  editorColors = config.editorColors
  defaultEditorColor = config.theme.defaultEditorColor
}

export function getEditorColors(): EditorColors {
  return editorColors
}

export function getDefaultEditorColor(): string {
  const editorColorNames = Object.keys(editorColors)

  return editorColorNames.includes(defaultEditorColor)
    ? defaultEditorColor
    : (editorColorNames[0] ?? 'red')
}

export function getEditorColor(name: string): EditorColor | null {
  return getEditorColors()[name] ?? null
}
