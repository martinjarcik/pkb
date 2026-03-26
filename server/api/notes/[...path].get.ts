import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createError, defineEventHandler } from 'h3'
import yaml from 'yaml'
import type { StorageConfig } from '~/storage/router'
import { getNoteStorage } from '~/storage/router'

async function loadServerConfig(): Promise<StorageConfig> {
  const rawConfig = await readFile(
    resolve(process.cwd(), 'app/config/default.yaml'),
    'utf-8',
  )
  const parsed = yaml.parse(rawConfig) as Record<string, unknown> | null

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Config must be an object')
  }

  if (
    parsed.applicationType !== 'desktop' &&
    parsed.applicationType !== 'browser'
  ) {
    throw new Error(
      `Config applicationType must be "desktop" or "browser", got: ${String(parsed.applicationType)}`,
    )
  }

  if (typeof parsed.vault !== 'string' || parsed.vault.length === 0) {
    throw new Error('Config vault must be a non-empty string')
  }

  return {
    applicationType: parsed.applicationType,
    vault: parsed.vault,
  }
}

function parseNoteId(pathParam: string | undefined): string {
  if (!pathParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing note id',
    })
  }

  let segments: string[]

  try {
    segments = pathParam
      .split('/')
      .map((segment) => decodeURIComponent(segment))
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note id',
    })
  }

  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === '.' ||
        segment === '..' ||
        segment.includes('\\'),
    )
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note id',
    })
  }

  return segments.join('/')
}

export default defineEventHandler(async (event) => {
  const storage = getNoteStorage(await loadServerConfig())
  const note = await storage.loadNoteById(
    parseNoteId(event.context.params?.path),
  )

  if (!note) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Note not found',
    })
  }

  return note
})
