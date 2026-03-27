import { readFile } from 'node:fs/promises'
import yaml from 'yaml'
import type { StorageConfig } from '~/storage/router'
import { getDefaultConfigPath, getUserConfigPath } from './appConfigPath'

export type ServerLoadedConfig = StorageConfig & {
  trashRetentionDays: number
}

function parseTrashRetentionDays(parsed: Record<string, unknown>): number {
  const notes = parsed.notes

  if (notes === undefined) {
    return 30
  }

  if (typeof notes !== 'object' || notes === null || Array.isArray(notes)) {
    throw new Error('Config notes must be an object')
  }

  const notesObj = notes as Record<string, unknown>
  const days = notesObj.trashRetentionDays

  if (days === undefined) {
    return 30
  }

  if (typeof days !== 'number' || !Number.isInteger(days) || days < 1) {
    throw new Error(
      'Config notes.trashRetentionDays must be a positive integer',
    )
  }

  return days
}

async function readRawConfig(): Promise<string> {
  try {
    return await readFile(getUserConfigPath(), 'utf-8')
  } catch {
    return await readFile(getDefaultConfigPath(), 'utf-8')
  }
}

export async function loadServerConfig(): Promise<ServerLoadedConfig> {
  const rawConfig = await readRawConfig()
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
    trashRetentionDays: parseTrashRetentionDays(parsed),
  }
}
