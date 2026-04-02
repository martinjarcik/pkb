import { createError, defineEventHandler } from 'h3'
import { normalizeSaveProperties } from '~/notes/saveNoteInput'
import { getNoteStorage } from '~/storage/router'
import type { SaveNoteInput } from '~/storage/types'
import { cleanupOrphanedAssets } from '../cleanupOrphanedAssets'
import { dispatchNoteWebhook } from '../dispatchNoteWebhook'
import { loadServerConfig } from '../loadServerConfig'
import { isRecord, readJsonBody } from '../validation'

function parseSaveNoteInput(body: unknown): SaveNoteInput {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note save payload',
    })
  }

  const { id, content, properties } = body

  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    typeof content !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note save payload',
    })
  }

  if (!isRecord(properties)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note save payload',
    })
  }

  return {
    id,
    content,
    properties: normalizeSaveProperties(properties, content),
  }
}

export default defineEventHandler(async (event) => {
  const config = await loadServerConfig()
  const storage = getNoteStorage(config)
  const input = parseSaveNoteInput(await readJsonBody(event))

  const oldNote = await storage.loadNoteById(input.id)
  const oldContent = oldNote?.content ?? ''

  const saved = await storage.saveNote(input)

  if (config.applicationType === 'desktop') {
    cleanupOrphanedAssets(config.vault, oldContent, input.content)
  }

  const hook = saved.webhook

  if (typeof hook === 'string' && hook.length > 0) {
    void dispatchNoteWebhook(hook, 'updated', saved)
  }

  return saved
})
