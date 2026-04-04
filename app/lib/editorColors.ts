import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import type { EditorColor, EditorColors } from '~/config/parseAppConfig'

// This is the editor/lib bridge back to app config for the configured editor
// palette defaults. Keep the rest of `app/lib/` config-free where possible.
export function getEditorColors(): EditorColors {
  const { data: appConfigDisk } = useAppConfigDisk()

  return appConfigDisk.value.editorColors
}

export function getDefaultEditorColor(): string {
  const { data: appConfigDisk } = useAppConfigDisk()
  const { editorColors, theme } = appConfigDisk.value
  const editorColorNames = Object.keys(editorColors)

  return editorColorNames.includes(theme.defaultEditorColor)
    ? theme.defaultEditorColor
    : (editorColorNames[0] ?? 'red')
}

export function getEditorColor(name: string): EditorColor | null {
  return getEditorColors()[name] ?? null
}
