export type NoteListStepDirection = 'previous' | 'next'

/** Next or previous id in list order; null when already at boundary or list empty. */
export function adjacentNoteListId(
  orderedIds: readonly string[],
  currentId: string | null,
  direction: NoteListStepDirection,
): string | null {
  if (orderedIds.length === 0) {
    return null
  }

  const index = currentId ? orderedIds.indexOf(currentId) : -1

  if (direction === 'next') {
    if (index === -1) {
      return orderedIds[0] ?? null
    }

    if (index < orderedIds.length - 1) {
      return orderedIds[index + 1] ?? null
    }

    return null
  }

  if (index === -1) {
    return orderedIds[orderedIds.length - 1] ?? null
  }

  if (index > 0) {
    return orderedIds[index - 1] ?? null
  }

  return null
}
