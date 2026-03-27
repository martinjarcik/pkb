type JsonObject = Record<string, unknown>

function isPlainObject(value: unknown): value is JsonObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

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
