import { createError, defineEventHandler, readBody } from 'h3'
import { getNoteStorage } from '~/storage/router'
import type { RenameNoteTitleInput } from '~/storage/types'
import { loadServerConfig } from '../loadServerConfig'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseRenameNoteTitleInput(body: unknown): RenameNoteTitleInput {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note rename payload',
    })
  }

  const { id, title } = body

  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    typeof title !== 'string' ||
    title.trim().length === 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note rename payload',
    })
  }

  return {
    id,
    title,
  }
}

export default defineEventHandler(async (event) => {
  const storage = getNoteStorage(await loadServerConfig())
  const body = await readBody(event)

  try {
    return await storage.renameNoteTitle(parseRenameNoteTitleInput(body))
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'Note title must contain at least one valid filename character'
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message,
      })
    }

    throw error
  }
})
