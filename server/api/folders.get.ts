import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineEventHandler } from 'h3'
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

export default defineEventHandler(async () => {
  const storage = getNoteStorage(await loadServerConfig())

  return storage.loadFolders()
})
