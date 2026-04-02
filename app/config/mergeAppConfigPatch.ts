import { isPlainObject, type JsonObject } from './isPlainObject'

/**
 * Deep-merge patch into base (plain objects only). Patch values win; nested objects merge recursively.
 */
export function deepMergeAppConfig(
  base: JsonObject,
  patch: JsonObject,
): JsonObject {
  const result: JsonObject = { ...base }

  for (const key of Object.keys(patch)) {
    const patchValue = patch[key]
    const baseValue = result[key]

    if (isPlainObject(patchValue) && isPlainObject(baseValue)) {
      result[key] = deepMergeAppConfig(baseValue, patchValue)
    } else {
      result[key] = patchValue
    }
  }

  return result
}
