import { defineEventHandler, createError } from 'h3'
import { mergeAndWriteMetaPatch } from '../metaDisk'
import { readJsonBody } from '../validation'

export default defineEventHandler(async (event) => {
  const body = await readJsonBody(event)

  try {
    return await mergeAndWriteMetaPatch(body)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    throw createError({
      statusCode: 400,
      statusMessage: message,
    })
  }
})
