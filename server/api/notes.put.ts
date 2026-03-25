import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createError, defineEventHandler, readBody } from 'h3'
import yaml from 'yaml'
import type { StorageConfig } from '~/storage/router'
import { getNoteStorage } from '~/storage/router'
import { sanitizeProperties } from '~/storage/document'
import type { SaveNoteInput } from '~/storage/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

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
  const storage = getNoteStorage(await loadServerConfig())
  const body = await readBody(event)

  return storage.saveNote(parseSaveNoteInput(body))
})
