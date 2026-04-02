import { loadConfig } from '~/config/loader'

// This is the editor/lib bridge back to app config for the configured editor
// palette defaults. Keep the rest of `app/lib/` config-free where possible.
const { editorColors, theme } = loadConfig()
const editorColorNames = Object.keys(editorColors)

export const EDITOR_COLORS = editorColors
export const DEFAULT_EDITOR_COLOR = editorColorNames.includes(
  theme.defaultEditorColor,
)
  ? theme.defaultEditorColor
  : (editorColorNames[0] ?? 'red')
