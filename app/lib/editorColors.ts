import { loadConfig } from '~/config/loader'

const { editorColors, theme } = loadConfig()
const editorColorNames = Object.keys(editorColors)

export const EDITOR_COLORS = editorColors
export const DEFAULT_EDITOR_COLOR = editorColorNames.includes(
  theme.defaultEditorColor,
)
  ? theme.defaultEditorColor
  : (editorColorNames[0] ?? 'red')
