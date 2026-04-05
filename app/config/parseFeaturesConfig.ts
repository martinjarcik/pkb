import type { AppConfig } from './parseAppConfig'

function parseBooleanFlag(
  flags: Record<string, unknown>,
  key: keyof AppConfig['features'],
  defaultValue: boolean,
): boolean {
  const value = flags[key]

  if (value === undefined) {
    return defaultValue
  }

  if (typeof value !== 'boolean') {
    throw new Error(`Config features.${key} must be a boolean`)
  }

  return value
}

export function parseFeaturesConfig(
  obj: Record<string, unknown>,
): AppConfig['features'] {
  if (obj.features !== undefined) {
    if (typeof obj.features !== 'object' || obj.features === null) {
      throw new Error('Config features must be an object')
    }
  }

  const features =
    obj.features === undefined ? {} : (obj.features as Record<string, unknown>)

  return {
    favorites: parseBooleanFlag(features, 'favorites', true),
    tasks: parseBooleanFlag(features, 'tasks', true),
    pinned: parseBooleanFlag(features, 'pinned', true),
    nonDistractionMode: parseBooleanFlag(features, 'nonDistractionMode', true),
    noteWebhook: parseBooleanFlag(features, 'noteWebhook', true),
  }
}
