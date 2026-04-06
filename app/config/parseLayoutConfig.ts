import type { AppConfig } from './parseAppConfig'

export const DEFAULT_SIDEBAR_PANEL_WIDTH = 300
export const DEFAULT_NOTES_LIST_PANEL_WIDTH = 370

function parsePanelWidth(
  value: unknown,
  fallback: number,
  key: 'sidebarPanelWidth' | 'notesListPanelWidth',
): number {
  if (value === undefined) {
    return fallback
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Config layout.${key} must be a positive number`)
  }

  return value
}

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
    sidebarPanelWidth: parsePanelWidth(
      layout.sidebarPanelWidth,
      DEFAULT_SIDEBAR_PANEL_WIDTH,
      'sidebarPanelWidth',
    ),
    notesListPanelWidth: parsePanelWidth(
      layout.notesListPanelWidth,
      DEFAULT_NOTES_LIST_PANEL_WIDTH,
      'notesListPanelWidth',
    ),
  }
}
