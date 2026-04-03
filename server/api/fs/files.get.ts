import { createError, defineEventHandler, getQuery } from 'h3'
import { listMarkdownFiles } from '../../fileSystemProxy'

export default defineEventHandler(async (event) => {
  const { dir } = getQuery(event)

  if (typeof dir !== 'string' || dir.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'dir must be a non-empty string',
    })
  }

  try {
    return await listMarkdownFiles(dir)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage:
        error instanceof Error ? error.message : 'Failed to list files',
    })
  }
})
