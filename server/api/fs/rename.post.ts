import { createError, defineEventHandler, readBody } from 'h3'
import { renameFileWithinRoot } from '../../fileSystemProxy'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { dir, oldPath, newPath } =
    typeof body === 'object' && body !== null ? body : {}

  if (
    typeof dir !== 'string' ||
    dir.length === 0 ||
    typeof oldPath !== 'string' ||
    oldPath.length === 0 ||
    typeof newPath !== 'string' ||
    newPath.length === 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'dir, oldPath, and newPath are required',
    })
  }

  try {
    await renameFileWithinRoot(dir, oldPath, newPath)
    return { ok: true }
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage:
        error instanceof Error ? error.message : 'Failed to rename file',
    })
  }
})
