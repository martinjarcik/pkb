import { loadConfig } from '~/config/loader'

const defaultTheme = loadConfig().theme

export function useAppTheme() {
  return {
    accentColor: defaultTheme.accentColor,
    defaultEditorColor: defaultTheme.defaultEditorColor,
  }
}
