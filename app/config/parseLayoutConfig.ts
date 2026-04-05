import type { AppConfig } from './parseAppConfig'

export function parseLayoutConfig(
  obj: Record<string, unknown>,
): AppConfig['layout'] {
  if (typeof obj.layout !== 'object' || obj.layout === null) {
    throw new Error('Config layout must be an object')
  }

  const layout = obj.layout as Record<string, unknown>

  for (const key of ['showSidebarPanel', 'showNotesListPanel'] as const) {
    if (typeof layout[key] !== 'boolean') {
      throw new Error(`Config layout.${key} must be a boolean`)
    }
  }

  return {
    showSidebarPanel: layout.showSidebarPanel as boolean,
    showNotesListPanel: layout.showNotesListPanel as boolean,
  }
}
