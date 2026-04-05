export type FolderMeta = {
  icon?: string
}

export type WorkspaceMeta = {
  folders: Record<string, FolderMeta>
}

export function parseFolderMeta(value: unknown): FolderMeta {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Folder meta must be an object')
  }

  const obj = value as Record<string, unknown>

  if (obj.icon === undefined) {
    return {}
  }

  if (typeof obj.icon !== 'string') {
    throw new Error('Folder meta icon must be a string')
  }

  return { icon: obj.icon }
}

export function parseMeta(value: unknown): WorkspaceMeta {
  if (value === undefined) {
    return { folders: {} }
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Meta must be an object')
  }

  const obj = value as Record<string, unknown>

  if (obj.folders === undefined) {
    return { folders: {} }
  }

  if (
    typeof obj.folders !== 'object' ||
    obj.folders === null ||
    Array.isArray(obj.folders)
  ) {
    throw new Error('Meta folders must be an object')
  }

  const foldersObj = obj.folders as Record<string, unknown>
  const folders: Record<string, FolderMeta> = {}

  for (const name of Object.keys(foldersObj)) {
    folders[name] = parseFolderMeta(foldersObj[name])
  }

  return { folders }
}
