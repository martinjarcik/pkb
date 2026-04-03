import { createError, defineEventHandler, readBody } from 'h3'
import { writeScopedTextFile, writeTextFileToRoot } from '../../fileSystemProxy'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { content, dir, path, scope } =
    typeof body === 'object' && body !== null ? body : {}

  if (typeof scope === 'string' && typeof content === 'string') {
    try {
      return await writeScopedTextFile(scope, content)
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage:
          error instanceof Error ? error.message : 'Failed to write file',
      })
    }
  }

  if (
    typeof dir !== 'string' ||
    dir.length === 0 ||
    typeof path !== 'string' ||
    path.length === 0 ||
    typeof content !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'dir, path, and content are required',
    })
  }

  try {
    return await writeTextFileToRoot(dir, path, content)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage:
        error instanceof Error ? error.message : 'Failed to write file',
    })
  }
})
