import { createError, defineEventHandler, readBody } from 'h3'
import { getNoteStorage } from '~/storage/router'
import { extractLocalImageRefs } from '~/storage/imageRefs'
import { deleteOrphanedAssetFiles } from '../deleteOrphanedAssetFiles'
import { loadServerConfig } from '../loadServerConfig'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

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
  const storage = getNoteStorage(config)
  const body = await readBody(event)
  const id = parseDeleteNoteInput(body)

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
