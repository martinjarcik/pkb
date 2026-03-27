import { defineEventHandler, createError } from 'h3'
import { readAppConfigFromDisk } from '../appConfigDisk'

export default defineEventHandler(async () => {
  try {
    return await readAppConfigFromDisk()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read app config: ${message}`,
    })
  }
})
