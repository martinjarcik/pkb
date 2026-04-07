import yaml from 'yaml'
import type { PlatformApi } from '~/storage/platformApi'
import { deepMergeMeta } from './mergeMetaPatch'
import {
  deepMergePlainObjects,
  isPlainObject,
  type JsonObject,
} from './isPlainObject'
import { loadConfig } from './loader'
import {
  DEFAULT_ONBOARDING_STATE,
  parseOnboardingState,
  type OnboardingState,
} from './parseOnboardingState'
import { parseMeta, type WorkspaceMeta } from './parseMeta'
import { parseAppConfig, type AppConfig } from './parseAppConfig'

function assertPatchObject(value: unknown, label: string): JsonObject {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be an object`)
  }

  return value
}

function parseStoredYaml(raw: string | undefined): unknown {
  return raw === undefined ? undefined : (yaml.parse(raw) as unknown)
}

export async function readAppConfigPersistence(
  platformApi: PlatformApi,
): Promise<AppConfig> {
  const current = parseStoredYaml(
    await platformApi.readScopedTextFile('app-config'),
  )

  return parseAppConfig(current ?? loadConfig())
}

export async function writeAppConfigPatchPersistence(
  platformApi: PlatformApi,
  patch: unknown,
): Promise<AppConfig> {
  const validatedPatch = assertPatchObject(patch, 'Config patch')
  const current = assertPatchObject(
    parseStoredYaml(await platformApi.readScopedTextFile('app-config')) ??
      loadConfig(),
    'Stored config',
  )
  const merged = deepMergePlainObjects(current, validatedPatch)
  const validated = parseAppConfig(merged)

  await platformApi.writeScopedTextFile('app-config', yaml.stringify(merged))

  return validated
}

export async function readOnboardingPersistence(
  platformApi: PlatformApi,
): Promise<OnboardingState> {
  return parseOnboardingState(
    parseStoredYaml(await platformApi.readScopedTextFile('onboarding')) ??
      DEFAULT_ONBOARDING_STATE,
  )
}

export async function writeOnboardingPersistence(
  platformApi: PlatformApi,
  nextState: unknown,
): Promise<OnboardingState> {
  const validated = parseOnboardingState(nextState)

  await platformApi.writeScopedTextFile('onboarding', yaml.stringify(validated))

  return validated
}

export async function readMetaPersistence(
  platformApi: PlatformApi,
): Promise<WorkspaceMeta> {
  return parseMeta(
    parseStoredYaml(await platformApi.readScopedTextFile('meta')),
  )
}

export async function writeMetaPatchPersistence(
  platformApi: PlatformApi,
  patch: unknown,
): Promise<WorkspaceMeta> {
  const validatedPatch = assertPatchObject(patch, 'Meta patch')
  const current =
    parseStoredYaml(await platformApi.readScopedTextFile('meta')) ?? {}
  const merged = deepMergeMeta(
    assertPatchObject(current, 'Stored meta'),
    validatedPatch,
  )
  const validated = parseMeta(merged)

  await platformApi.writeScopedTextFile('meta', yaml.stringify(merged))

  return validated
}
