export type NoteMetadata = {
  createdAt: string
  updatedAt: string
}

export type Note = {
  id: string
  title: string
  content: string
  metadata: NoteMetadata
}
