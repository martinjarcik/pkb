export function isVaultRootNote(noteId: string): boolean {
  return !noteId.includes('/')
}
