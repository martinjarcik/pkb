import { createError, defineEventHandler, getQuery } from 'h3'
import { deleteFileFromRoot } from '../../fileSystemProxy'

export default defineEventHandler(async (event) => {
  const { dir, path } = getQuery(event)

  if (
    typeof dir !== 'string' ||
    dir.length === 0 ||
    typeof path !== 'string' ||
    path.length === 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'dir and path must be non-empty strings',
    })
  }

  try {
    await deleteFileFromRoot(dir, path)
    return { ok: true }
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage:
        error instanceof Error ? error.message : 'Failed to delete file',
    })
  }
})
