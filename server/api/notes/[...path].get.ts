import { createError, defineEventHandler } from 'h3'
import { getNoteStorage } from '~/storage/router'
import { loadServerConfig } from '../../loadServerConfig'

function parseNoteId(pathParam: string | undefined): string {
  if (!pathParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing note id',
    })
  }

  let segments: string[]

  try {
    segments = pathParam
      .split('/')
      .map((segment) => decodeURIComponent(segment))
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note id',
    })
  }

  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === '.' ||
        segment === '..' ||
        segment.includes('\\'),
    )
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note id',
    })
  }

  return segments.join('/')
}

export default defineEventHandler(async (event) => {
  const storage = getNoteStorage(await loadServerConfig())
  const note = await storage.loadNoteById(
    parseNoteId(event.context.params?.path),
  )

  if (!note) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Note not found',
    })
  }

  return note
})
