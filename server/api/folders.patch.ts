import { createError, defineEventHandler, readBody } from 'h3'
import { getNoteStorage } from '~/storage/router'
import { sanitizeNoteTitleForFilename } from '~/notes/renameNoteTitle'
import { loadServerConfig } from '../loadServerConfig'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseRenameFolderInput(body: unknown): {
  oldName: string
  newName: string
} {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid folder rename payload',
    })
  }

  const { oldName, newName } = body

  if (typeof oldName !== 'string' || oldName.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'oldName must be a non-empty string',
    })
  }

  if (typeof newName !== 'string' || newName.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'newName must be a non-empty string',
    })
  }

  const sanitized = sanitizeNoteTitleForFilename(newName)

  if (sanitized.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New folder name contains only invalid characters',
    })
  }

  return { oldName, newName: sanitized }
}

export default defineEventHandler(async (event) => {
  const storage = getNoteStorage(await loadServerConfig())
  const body = await readBody(event)
  const { oldName, newName } = parseRenameFolderInput(body)

  await storage.renameFolder(oldName, newName)

  return { oldName, newName }
})
