import { createError, defineEventHandler, readBody } from 'h3'
import { getNoteStorage } from '~/storage/router'
import { sanitizeProperties } from '~/storage/document'
import { orphanedImageRefs } from '~/storage/imageRefs'
import type { SaveNoteInput } from '~/storage/types'
import { dispatchNoteWebhook } from '../dispatchNoteWebhook'
import { deleteOrphanedAssetFiles } from '../deleteOrphanedAssetFiles'
import { loadServerConfig } from '../loadServerConfig'
import { isRecord } from '../validation'

export function parseSaveNoteInput(body: unknown): SaveNoteInput {
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
    properties: sanitizeProperties(properties),
  }
}

export default defineEventHandler(async (event) => {
  const config = await loadServerConfig()
  const storage = getNoteStorage(config)
  const body = await readBody(event)
  const input = parseSaveNoteInput(body)

  const oldNote = await storage.loadNoteById(input.id)
  const oldContent = oldNote?.content ?? ''

  const saved = await storage.saveNote(input)

  if (config.applicationType === 'desktop') {
    const orphaned = orphanedImageRefs(oldContent, input.content)

    if (orphaned.length > 0) {
      void deleteOrphanedAssetFiles(config.vault, orphaned)
    }
  }

  const hook = saved.webhook

  if (typeof hook === 'string' && hook.length > 0) {
    void dispatchNoteWebhook(hook, 'updated', saved)
  }

  return saved
})
