import { createError, defineEventHandler, readBody } from 'h3'
import { getNoteStorage } from '~/storage/router'
import { sanitizeNoteTitleForFilename } from '~/notes/noteId'
import { loadServerConfig } from '../loadServerConfig'
import { isRecord } from '../validation'

function parseCreateFolderInput(body: unknown): string {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid folder creation payload',
    })
  }

  const { name } = body

  if (typeof name !== 'string' || name.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Folder name must be a non-empty string',
    })
  }

  const sanitized = sanitizeNoteTitleForFilename(name)

  if (sanitized.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Folder name contains only invalid characters',
    })
  }

  return sanitized
}

export default defineEventHandler(async (event) => {
  const storage = getNoteStorage(await loadServerConfig())
  const body = await readBody(event)
  const folderName = parseCreateFolderInput(body)

  await storage.createFolder(folderName)

  return { name: folderName }
})
