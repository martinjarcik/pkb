import { createError, defineEventHandler, readBody } from 'h3'
import { InvalidNoteTitleError } from '~/notes/noteId'
import { getNoteStorage } from '~/storage/router'
import type { RenameNoteTitleInput } from '~/storage/types'
import { loadServerConfig } from '../loadServerConfig'
import { isRecord } from '../validation'

function parseRenameNoteTitleInput(body: unknown): RenameNoteTitleInput {
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
    if (error instanceof InvalidNoteTitleError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message,
      })
    }

    throw error
  }
})
