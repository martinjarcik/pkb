import { createError, defineEventHandler } from 'h3'
import { sanitizeNoteTitleForFilename } from '~/notes/noteId'
import { getServerNoteStorage } from '../getServerNoteStorage'
import { loadServerConfig } from '../loadServerConfig'
import { isRecord, readJsonBody } from '../validation'

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
  const storage = getServerNoteStorage(await loadServerConfig())
  const { oldName, newName } = parseRenameFolderInput(await readJsonBody(event))

  await storage.renameFolder(oldName, newName)

  return { oldName, newName }
})
