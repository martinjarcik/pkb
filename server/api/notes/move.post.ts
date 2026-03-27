import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createError, defineEventHandler, readBody } from 'h3'
import yaml from 'yaml'
import type { StorageConfig } from '~/storage/router'
import { getNoteStorage } from '~/storage/router'
import type { MoveNoteInput } from '~/storage/types'

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

function parseMoveNoteInput(body: unknown): MoveNoteInput {
  if (!isRecord(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note move payload',
    })
  }

  const { id, targetParentPath } = body

  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    typeof targetParentPath !== 'string' ||
    targetParentPath.includes('/') ||
    targetParentPath.includes('\\')
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid note move payload',
    })
  }

  return {
    id,
    targetParentPath,
  }
}

export default defineEventHandler(async (event) => {
  const storage = getNoteStorage(await loadServerConfig())
  const body = await readBody(event)

  return storage.moveNote(parseMoveNoteInput(body))
})
