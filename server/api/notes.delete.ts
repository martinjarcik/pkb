import { createError, defineEventHandler } from 'h3'
import { extractLocalImageRefs } from '~/storage/imageRefs'
import { deleteOrphanedAssetFiles } from '../deleteOrphanedAssetFiles'
import { getServerNoteStorage } from '../getServerNoteStorage'
import { loadServerConfig } from '../loadServerConfig'
import { isRecord, readJsonBody } from '../validation'

export function parseDeleteNoteInput(body: unknown): string {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note delete payload',
    })
  }

  const { id } = body

  if (typeof id !== 'string' || id.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note delete payload',
    })
  }

  return id
}

export default defineEventHandler(async (event) => {
  const config = await loadServerConfig()
  const storage = getServerNoteStorage(config)
  const id = parseDeleteNoteInput(await readJsonBody(event))

  const note = await storage.loadNoteById(id)

  await storage.deleteNote(id)

  if (config.applicationType === 'desktop' && note) {
    const refs = [...extractLocalImageRefs(note.content)]

    if (refs.length > 0) {
      void deleteOrphanedAssetFiles(config.vault, refs)
    }
  }

  return { success: true }
})
