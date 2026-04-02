import { defineEventHandler, readBody, createError } from 'h3'
import { mergeAndWriteMetaPatch } from '../metaDisk'
import { isRecord } from '../validation'

export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event)

  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must be a JSON object',
    })
  }

  try {
    return await mergeAndWriteMetaPatch(body as Record<string, unknown>)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    throw createError({
      statusCode: 400,
      statusMessage: message,
    })
  }
})
