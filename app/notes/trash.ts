import type { NoteProperties } from './types'

export function catalogRowIsTrashed(row: NoteProperties): boolean {
  return typeof row.trashedAt === 'string' && row.trashedAt.length > 0
}

export function trashExpired(
  trashedAt: string,
  retentionDays: number,
  now: Date,
): boolean {
  const trashedTime = new Date(trashedAt).getTime()

  if (Number.isNaN(trashedTime)) {
    return false
  }

  const retentionMs = retentionDays * 86_400_000

  return now.getTime() - trashedTime >= retentionMs
}

export function withoutTrashedAt(properties: NoteProperties): NoteProperties {
  const { trashedAt: _removed, ...rest } = properties

  return rest
}
