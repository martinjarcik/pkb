import yaml from 'yaml'
import type { PlatformApi } from '~/storage/platformApi'
import { deepMergeAppConfig } from './mergeAppConfigPatch'
import { deepMergeMeta } from './mergeMetaPatch'
import { isPlainObject, type JsonObject } from './isPlainObject'
import { loadConfig } from './loader'
import { parseMeta, type WorkspaceMeta } from './parseMeta'
import {
  parseAppConfig,
  type AppConfig,
  type StorageType,
} from './parseAppConfig'

function assertPatchObject(value: unknown, label: string): JsonObject {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be an object`)
  }

  return value
}

function requirePlatformApi(
  storageType: StorageType,
  platformApi: PlatformApi | null,
): PlatformApi {
  if (storageType === 'filesystem' && platformApi === null) {
    throw new Error('Platform API is required for filesystem persistence')
  }

  return platformApi as PlatformApi
}

function parseStoredYaml(raw: string | undefined): unknown {
  return raw === undefined ? undefined : (yaml.parse(raw) as unknown)
}

export async function readAppConfigPersistence(
  storageType: StorageType,
  platformApi: PlatformApi | null,
): Promise<AppConfig> {
  const api = requirePlatformApi(storageType, platformApi)
  const current = parseStoredYaml(await api.readScopedTextFile('app-config'))

  return parseAppConfig(current ?? loadConfig())
}

export async function writeAppConfigPatchPersistence(
  storageType: StorageType,
  platformApi: PlatformApi | null,
  patch: unknown,
): Promise<AppConfig> {
  const validatedPatch = assertPatchObject(patch, 'Config patch')
  const api = requirePlatformApi(storageType, platformApi)
  const current = assertPatchObject(
    parseStoredYaml(await api.readScopedTextFile('app-config')) ?? loadConfig(),
    'Stored config',
  )
  const merged = deepMergeAppConfig(current, validatedPatch)
  const validated = parseAppConfig(merged)

  await api.writeScopedTextFile('app-config', yaml.stringify(merged))

  return validated
}

export async function readMetaPersistence(
  storageType: StorageType,
  platformApi: PlatformApi | null,
): Promise<WorkspaceMeta> {
  const api = requirePlatformApi(storageType, platformApi)

  return parseMeta(parseStoredYaml(await api.readScopedTextFile('meta')))
}

export async function writeMetaPatchPersistence(
  storageType: StorageType,
  platformApi: PlatformApi | null,
  patch: unknown,
): Promise<WorkspaceMeta> {
  const validatedPatch = assertPatchObject(patch, 'Meta patch')
  const api = requirePlatformApi(storageType, platformApi)
  const current = parseStoredYaml(await api.readScopedTextFile('meta')) ?? {}
  const merged = deepMergeMeta(
    assertPatchObject(current, 'Stored meta'),
    validatedPatch,
  )
  const validated = parseMeta(merged)

  await api.writeScopedTextFile('meta', yaml.stringify(merged))

  return validated
}
