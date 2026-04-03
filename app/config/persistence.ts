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
  type ApplicationType,
} from './parseAppConfig'

const APP_CONFIG_STORAGE_KEY = 'pkb:app-config'
const META_STORAGE_KEY = 'pkb:workspace-meta'

function getLocalStorage(): Storage {
  if (typeof localStorage === 'undefined') {
    throw new Error('Browser storage is only available in the browser')
  }

  return localStorage
}

function readStoredJsonObject(key: string): JsonObject | null {
  const raw = getLocalStorage().getItem(key)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as unknown

    return isPlainObject(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeStoredJsonObject(key: string, value: JsonObject): void {
  getLocalStorage().setItem(key, JSON.stringify(value))
}

function assertPatchObject(value: unknown, label: string): JsonObject {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be an object`)
  }

  return value
}

function requirePlatformApi(
  applicationType: ApplicationType,
  platformApi: PlatformApi | null,
): PlatformApi {
  if (applicationType === 'desktop' && platformApi === null) {
    throw new Error('Platform API is required for desktop persistence')
  }

  return platformApi as PlatformApi
}

function parseStoredYaml(raw: string | undefined): unknown {
  return raw === undefined ? undefined : (yaml.parse(raw) as unknown)
}

export async function readAppConfigPersistence(
  applicationType: ApplicationType,
  platformApi: PlatformApi | null,
): Promise<AppConfig> {
  if (applicationType === 'browser') {
    const stored = readStoredJsonObject(APP_CONFIG_STORAGE_KEY)
    return parseAppConfig(stored ?? loadConfig())
  }

  const api = requirePlatformApi(applicationType, platformApi)
  const current = parseStoredYaml(await api.readScopedTextFile('app-config'))

  return parseAppConfig(current ?? loadConfig())
}

export async function writeAppConfigPatchPersistence(
  applicationType: ApplicationType,
  platformApi: PlatformApi | null,
  patch: unknown,
): Promise<AppConfig> {
  const validatedPatch = assertPatchObject(patch, 'Config patch')

  if (applicationType === 'browser') {
    const current = readStoredJsonObject(APP_CONFIG_STORAGE_KEY) ?? loadConfig()
    const merged = deepMergeAppConfig(
      assertPatchObject(current, 'Stored config'),
      validatedPatch,
    )
    const validated = parseAppConfig(merged)

    writeStoredJsonObject(APP_CONFIG_STORAGE_KEY, merged)

    return validated
  }

  const api = requirePlatformApi(applicationType, platformApi)
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
  applicationType: ApplicationType,
  platformApi: PlatformApi | null,
): Promise<WorkspaceMeta> {
  if (applicationType === 'browser') {
    return parseMeta(readStoredJsonObject(META_STORAGE_KEY) ?? undefined)
  }

  const api = requirePlatformApi(applicationType, platformApi)

  return parseMeta(parseStoredYaml(await api.readScopedTextFile('meta')))
}

export async function writeMetaPatchPersistence(
  applicationType: ApplicationType,
  platformApi: PlatformApi | null,
  patch: unknown,
): Promise<WorkspaceMeta> {
  const validatedPatch = assertPatchObject(patch, 'Meta patch')

  if (applicationType === 'browser') {
    const current = readStoredJsonObject(META_STORAGE_KEY) ?? {}
    const merged = deepMergeMeta(
      assertPatchObject(current, 'Stored meta'),
      validatedPatch,
    )
    const validated = parseMeta(merged)

    writeStoredJsonObject(META_STORAGE_KEY, merged)

    return validated
  }

  const api = requirePlatformApi(applicationType, platformApi)
  const current = parseStoredYaml(await api.readScopedTextFile('meta')) ?? {}
  const merged = deepMergeMeta(
    assertPatchObject(current, 'Stored meta'),
    validatedPatch,
  )
  const validated = parseMeta(merged)

  await api.writeScopedTextFile('meta', yaml.stringify(merged))

  return validated
}
