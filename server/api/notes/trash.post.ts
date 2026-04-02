import { createError, defineEventHandler, readBody } from 'h3'
import { getNoteStorage } from '~/storage/router'
import { dispatchNoteWebhook } from '../../dispatchNoteWebhook'
import { loadServerConfig } from '../../loadServerConfig'
import { isRecord } from '../../validation'

function parseSoftDeleteNoteInput(body: unknown): string {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note trash payload',
    })
  }

  const { id } = body

  if (typeof id !== 'string' || id.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note trash payload',
    })
  }

  return id
}

export default defineEventHandler(async (event) => {
  const storage = getNoteStorage(await loadServerConfig())
  const body = await readBody(event)

  const trashed = await storage.softDeleteNote(parseSoftDeleteNoteInput(body))
  const hook = trashed.webhook

  if (typeof hook === 'string' && hook.length > 0) {
    void dispatchNoteWebhook(hook, 'deleted', trashed)
  }

  return trashed
})
