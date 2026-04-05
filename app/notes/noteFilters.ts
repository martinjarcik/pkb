export function isVaultRootNote(noteId: string): boolean {
  return !noteId.includes('/')
}

export function vaultTopLevelFolderNames(noteIds: string[]): string[] {
  return [
    ...new Set(
      noteIds
        .filter((noteId) => noteId.includes('/'))
        .map((noteId) => noteId.split('/')[0] ?? ''),
    ),
  ].sort((left, right) => left.localeCompare(right))
}

export function isDirectChildOfFolder(
  noteId: string,
  folderPath: string,
): boolean {
  if (folderPath.length === 0) {
    return false
  }

  const prefix = folderPath + '/'

  if (!noteId.startsWith(prefix)) {
    return false
  }

  return !noteId.slice(prefix.length).includes('/')
}
