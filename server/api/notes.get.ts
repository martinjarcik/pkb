import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineEventHandler } from 'h3'
import yaml from 'yaml'
import type { NoteCatalogRow } from '~/notes/types'
import type { StorageConfig } from '~/storage/router'
import { getNoteStorage } from '~/storage/router'
import type { NoteStorage } from '~/storage/types'

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

export async function loadNotesResponse(
  storage?: NoteStorage,
): Promise<NoteCatalogRow[]> {
  const resolvedStorage = storage ?? getNoteStorage(await loadServerConfig())

  return resolvedStorage.loadNotesCatalog()
}

export default defineEventHandler(async () => {
  return loadNotesResponse()
})
