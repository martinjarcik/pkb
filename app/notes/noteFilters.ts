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

export function isDirectChildOfVaultFolder(
  noteId: string,
  folderName: string,
): boolean {
  if (folderName.length === 0 || folderName.includes('/')) {
    return false
  }

  const pathSegments = noteId.split('/')

  return pathSegments.length === 2 && pathSegments[0] === folderName
}
