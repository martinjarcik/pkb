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

export type NoteProperties = Record<string, NotePropertyValue>

export const NOTE_CATALOG_CONTENT_BYTES = 1024

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
  // Note catalog rows keep only the preview slice used by the notes list.
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
