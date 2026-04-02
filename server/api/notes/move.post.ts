import { createError, defineEventHandler } from 'h3'
import { getNoteStorage } from '~/storage/router'
import type { MoveNoteInput } from '~/storage/types'
import { loadServerConfig } from '../../loadServerConfig'
import { isRecord, readJsonBody } from '../../validation'

function parseMoveNoteInput(body: unknown): MoveNoteInput {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note move payload',
    })
  }

  const { id, targetParentPath } = body
  const existingIds = Array.isArray(body.existingIds)
    ? body.existingIds.filter(
        (item): item is string => typeof item === 'string',
      )
    : undefined

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
    ...(existingIds ? { existingIds } : {}),
  }
}

export default defineEventHandler(async (event) => {
  const storage = getNoteStorage(await loadServerConfig())
  return storage.moveNote(parseMoveNoteInput(await readJsonBody(event)))
})
