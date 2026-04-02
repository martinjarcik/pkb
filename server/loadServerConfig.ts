import { readFile } from 'node:fs/promises'
import yaml from 'yaml'
import { parseAppConfig } from '~/config/parseAppConfig'
import type { StorageConfig } from '~/storage/router'
import { getDefaultConfigPath, getUserConfigPath } from './appConfigPath'

export type ServerLoadedConfig = StorageConfig & {
  trashRetentionDays: number
  assetsFolder: string
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
  const parsed = parseAppConfig(yaml.parse(rawConfig))

  return {
    applicationType: parsed.applicationType,
    vault: parsed.vault,
    trashRetentionDays: parsed.notes.trashRetentionDays,
    assetsFolder: parsed.editor.assetsFolder,
  }
}
