import type { Note } from '~/notes/types'
import type { NoteStorage } from '~/storage/types'

function normalizeSearchQuery(query: string): string {
  return query.trim().toLocaleLowerCase()
}

function noteMatchesQuery(note: Note, normalizedQuery: string): boolean {
  return (
    note.title.toLocaleLowerCase().includes(normalizedQuery) ||
    note.content.toLocaleLowerCase().includes(normalizedQuery)
  )
}

export async function searchNoteIds(
  storage: NoteStorage,
  query: string,
): Promise<string[]> {
  const normalizedQuery = normalizeSearchQuery(query)

  if (normalizedQuery.length === 0) {
    return []
  }

  const catalog = await storage.loadNotesCatalog()
  const matchingIds: string[] = []

  for (const row of catalog) {
    const note = await storage.loadNoteById(row.id)

    if (note && noteMatchesQuery(note, normalizedQuery)) {
      matchingIds.push(note.id)
    }
  }

  return matchingIds
}
