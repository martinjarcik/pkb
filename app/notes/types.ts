export const NOTE_SYSTEM_PROPERTY_KEYS = [
  'id',
  'content',
  'createdAt',
  'modifiedAt',
  'title',
  'description',
] as const

export type NoteSystemPropertyKey = (typeof NOTE_SYSTEM_PROPERTY_KEYS)[number]

export const APPLICATION_PROPERTY_KEYS = [
  'hasTasks',
  'trashedAt',
  'favorite',
  'pinned',
  'webhook',
] as const

export type ApplicationPropertyKey = (typeof APPLICATION_PROPERTY_KEYS)[number]

export type NotePropertyValue =
  | string
  | number
  | boolean
  | null
  | NotePropertyValue[]
  | { [key: string]: NotePropertyValue }

export type NoteProperties = Record<string, unknown>

export type Note = NoteProperties & {
  id: string
  content: string
  createdAt: string
  modifiedAt: string
  title: string
  description: string
  tags?: string[]
  hasTasks?: boolean
  trashedAt?: string
  favorite?: boolean
  pinned?: boolean
  webhook?: string
}

export type NoteCatalogRow = NoteProperties & {
  id: string
  createdAt: string
  modifiedAt: string
  title: string
  description: string
  tags?: string[]
  hasTasks?: boolean
  trashedAt?: string
  favorite?: boolean
  pinned?: boolean
  webhook?: string
}
