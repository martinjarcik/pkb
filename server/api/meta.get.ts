import { createError, defineEventHandler } from 'h3'
import { readMetaFromDisk } from '../metaDisk'

export default defineEventHandler(async () => {
  try {
    return await readMetaFromDisk()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read meta: ${message}`,
    })
  }
})
