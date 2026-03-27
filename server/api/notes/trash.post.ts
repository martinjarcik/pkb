import { createError, defineEventHandler, readBody } from 'h3'
import { getNoteStorage } from '~/storage/router'
import { loadServerConfig } from '../../loadServerConfig'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseSoftDeleteNoteInput(body: unknown): string {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note trash payload',
    })
  }

  const { id } = body

  if (typeof id !== 'string' || id.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note trash payload',
    })
  }

  return id
}

export default defineEventHandler(async (event) => {
  const storage = getNoteStorage(await loadServerConfig())
  const body = await readBody(event)

  return storage.softDeleteNote(parseSoftDeleteNoteInput(body))
})
