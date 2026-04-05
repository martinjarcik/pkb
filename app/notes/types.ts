export const NOTE_SYSTEM_PROPERTY_KEYS = [
  'id',
  'content',
  'createdAt',
  'modifiedAt',
  'title',
  'description',
] as const

export const APPLICATION_PROPERTY_KEYS = [
  'trashedAt',
  'favorite',
  'pinned',
  'webhook',
  'wide',
] as const

export type NotePropertyValue =
  | string
  | number
  | boolean
  | null
  | NotePropertyValue[]
  | { [key: string]: NotePropertyValue }

export type NoteProperties = Record<string, unknown>

type NoteFields = {
  id: string
  createdAt: string
  modifiedAt: string
  title: string
  description: string
  tags?: string[]
  trashedAt?: string
  favorite?: boolean
  pinned?: boolean
  webhook?: string
  wide?: boolean
}

export type Note = NoteProperties &
  NoteFields & {
    content: string
  }

export type NoteCatalogRow = NoteProperties & NoteFields
