export type JsonObject = Record<string, unknown>

/** Strict plain-object guard for safe recursive config/meta merging. */
export function isPlainObject(value: unknown): value is JsonObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

export function deepMergePlainObjects(
  base: JsonObject,
  patch: JsonObject,
): JsonObject {
  const result: JsonObject = { ...base }

  for (const key of Object.keys(patch)) {
    const patchValue = patch[key]
    const baseValue = result[key]

    if (isPlainObject(patchValue) && isPlainObject(baseValue)) {
      result[key] = deepMergePlainObjects(baseValue, patchValue)
      continue
    }

    result[key] = patchValue
  }

  return result
}
