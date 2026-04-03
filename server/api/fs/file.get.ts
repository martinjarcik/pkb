import { createError, defineEventHandler, getQuery } from 'h3'
import { readScopedTextFile, readTextFileFromRoot } from '../../fileSystemProxy'

export default defineEventHandler(async (event) => {
  const { dir, path, scope } = getQuery(event)

  if (typeof scope === 'string') {
    try {
      return await readScopedTextFile(scope)
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage:
          error instanceof Error ? error.message : 'Failed to read file',
      })
    }
  }

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
    return await readTextFileFromRoot(dir, path)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage:
        error instanceof Error ? error.message : 'Failed to read file',
    })
  }
})
