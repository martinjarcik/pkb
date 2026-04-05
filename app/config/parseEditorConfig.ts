import type { AppConfig } from './parseAppConfig'

function parseEditorAssetsFolder(editor: Record<string, unknown>): string {
  const raw = editor.assetsFolder

  if (raw === undefined) {
    return 'assets'
  }

  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error(
      'Config editor.assetsFolder must be a non-empty string when set',
    )
  }

  const path = raw.trim()

  for (const segment of path.split('/')) {
    if (
      segment.length === 0 ||
      segment === '.' ||
      segment === '..' ||
      segment.includes('\\')
    ) {
      throw new Error('Config editor.assetsFolder must be a safe relative path')
    }
  }

  return path
}

export function parseEditorConfig(
  obj: Record<string, unknown>,
): AppConfig['editor'] {
  if (typeof obj.editor !== 'object' || obj.editor === null) {
    throw new Error('Config editor must be an object')
  }

  const editor = obj.editor as Record<string, unknown>

  if (typeof editor.autosaveDelay !== 'number' || editor.autosaveDelay < 0) {
    throw new Error('Config editor.autosaveDelay must be a non-negative number')
  }

  return {
    autosaveDelay: editor.autosaveDelay,
    assetsFolder: parseEditorAssetsFolder(editor),
  }
}
