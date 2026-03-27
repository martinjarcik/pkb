import { createError, defineEventHandler, readBody } from 'h3'
import { getNoteStorage } from '~/storage/router'
import type { MoveNoteInput } from '~/storage/types'
import { loadServerConfig } from '../../loadServerConfig'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseMoveNoteInput(body: unknown): MoveNoteInput {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note move payload',
    })
  }

  const { id, targetParentPath } = body

  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    typeof targetParentPath !== 'string' ||
    targetParentPath.includes('/') ||
    targetParentPath.includes('\\')
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note move payload',
    })
  }

  return {
    id,
    targetParentPath,
  }
}

export default defineEventHandler(async (event) => {
  const storage = getNoteStorage(await loadServerConfig())
  const body = await readBody(event)

  return storage.moveNote(parseMoveNoteInput(body))
})
