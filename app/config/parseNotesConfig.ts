import type { AppConfig } from './parseAppConfig'

export function parseNotesConfig(
  obj: Record<string, unknown>,
): AppConfig['notes'] {
  if (typeof obj.notes !== 'object' || obj.notes === null) {
    throw new Error('Config notes must be an object')
  }

  const notes = obj.notes as Record<string, unknown>

  if (
    typeof notes.trashRetentionDays !== 'number' ||
    !Number.isInteger(notes.trashRetentionDays) ||
    notes.trashRetentionDays < 1
  ) {
    throw new Error(
      'Config notes.trashRetentionDays must be a positive integer',
    )
  }

  return {
    trashRetentionDays: notes.trashRetentionDays,
  }
}
