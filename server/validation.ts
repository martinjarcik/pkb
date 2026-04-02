import { createError, readBody, type H3Event } from 'h3'

/** Loose JSON-object guard for request bodies before deeper validation. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function readJsonBody(
  event: H3Event,
): Promise<Record<string, unknown>> {
  const body = await readBody<unknown>(event)

  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must be a JSON object',
    })
  }

  return body
}
