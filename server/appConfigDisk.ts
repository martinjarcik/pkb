import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import yaml from 'yaml'
import { deepMergeAppConfig } from '~/config/mergeAppConfigPatch'
import { parseAppConfig, type AppConfig } from '~/config/parseAppConfig'
import { getDefaultConfigPath, getUserConfigPath } from './appConfigPath'

async function readRawUserConfig(): Promise<string | null> {
  try {
    return await readFile(getUserConfigPath(), 'utf-8')
  } catch {
    return null
  }
}

export async function readAppConfigFromDisk(): Promise<AppConfig> {
  const userRaw = await readRawUserConfig()
  const raw = userRaw ?? (await readFile(getDefaultConfigPath(), 'utf-8'))
  const parsed = yaml.parse(raw) as unknown

  return parseAppConfig(parsed)
}

export async function mergeAndWriteAppConfigPatch(
  patch: Record<string, unknown>,
): Promise<AppConfig> {
  const userRaw = await readRawUserConfig()
  const raw = userRaw ?? (await readFile(getDefaultConfigPath(), 'utf-8'))
  const current = yaml.parse(raw) as Record<string, unknown>

  if (
    typeof current !== 'object' ||
    current === null ||
    Array.isArray(current)
  ) {
    throw new Error('Config must be an object')
  }

  if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
    throw new Error('Patch must be an object')
  }

  const merged = deepMergeAppConfig(current, patch)
  const validated = parseAppConfig(merged)
  const nextYaml = yaml.stringify(merged)
  const userPath = getUserConfigPath()

  await mkdir(dirname(userPath), { recursive: true })
  await writeFile(userPath, nextYaml, 'utf-8')

  return validated
}
