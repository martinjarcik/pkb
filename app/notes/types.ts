export const NOTE_SYSTEM_PROPERTY_KEYS = [
  'id',
  'content',
  'createdAt',
  'modifiedAt',
] as const

export type NoteSystemPropertyKey = (typeof NOTE_SYSTEM_PROPERTY_KEYS)[number]

export type NotePropertyValue =
  | string
  | number
  | boolean
  | null
  | NotePropertyValue[]
  | { [key: string]: NotePropertyValue }

export type NoteProperties = Record<string, NotePropertyValue>

export type Note = NoteProperties & {
  id: string
  content: string
  createdAt: string
  modifiedAt: string
}
