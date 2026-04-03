import { createError, defineEventHandler, readBody } from 'h3'
import { createDirectoryInRoot } from '../../fileSystemProxy'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { dir, path } = typeof body === 'object' && body !== null ? body : {}

  if (
    typeof dir !== 'string' ||
    dir.length === 0 ||
    typeof path !== 'string' ||
    path.length === 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'dir and path are required',
    })
  }

  try {
    await createDirectoryInRoot(dir, path)
    return { ok: true }
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage:
        error instanceof Error ? error.message : 'Failed to create directory',
    })
  }
})
