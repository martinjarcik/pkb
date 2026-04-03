import { createError, defineEventHandler } from 'h3'
import { dispatchNoteWebhook } from '../../dispatchNoteWebhook'
import { getServerNoteStorage } from '../../getServerNoteStorage'
import { loadServerConfig } from '../../loadServerConfig'
import { isRecord, readJsonBody } from '../../validation'

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
  const storage = getServerNoteStorage(await loadServerConfig())
  const trashed = await storage.softDeleteNote(
    parseSoftDeleteNoteInput(await readJsonBody(event)),
  )
  const hook = trashed.webhook

  if (typeof hook === 'string' && hook.length > 0) {
    void dispatchNoteWebhook(hook, 'deleted', trashed)
  }

  return trashed
})
