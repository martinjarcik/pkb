import { createError, defineEventHandler, readBody } from 'h3'
import { getNoteStorage } from '~/storage/router'
import { sanitizeProperties } from '~/storage/document'
import type { SaveNoteInput } from '~/storage/types'
import { loadServerConfig } from '../loadServerConfig'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseSaveNoteInput(body: unknown): SaveNoteInput {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note save payload',
    })
  }

  const { id, content, properties } = body

  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    typeof content !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note save payload',
    })
  }

  if (!isRecord(properties)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note save payload',
    })
  }

  return {
    id,
    content,
    properties: sanitizeProperties(properties),
  }
}

export default defineEventHandler(async (event) => {
  const storage = getNoteStorage(await loadServerConfig())
  const body = await readBody(event)

  return storage.saveNote(parseSaveNoteInput(body))
})
