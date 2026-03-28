type JsonObject = Record<string, unknown>

function isPlainObject(value: unknown): value is JsonObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function mergeFoldersRecord(base: JsonObject, patch: JsonObject): JsonObject {
  let result: JsonObject = { ...base }

  for (const key of Object.keys(patch)) {
    const patchValue = patch[key]

    if (patchValue === null) {
      result = Object.fromEntries(
        Object.entries(result).filter(([entryKey]) => entryKey !== key),
      )
      continue
    }

    if (isPlainObject(patchValue) && isPlainObject(result[key])) {
      result[key] = mergeFoldersRecord(
        result[key] as JsonObject,
        patchValue as JsonObject,
      )
    } else {
      result[key] = patchValue
    }
  }

  return result
}

/**
 * Deep-merge patch into base. For `folders`, a `null` value removes that folder key.
 */
export function deepMergeMeta(base: JsonObject, patch: JsonObject): JsonObject {
  const result: JsonObject = { ...base }

  for (const key of Object.keys(patch)) {
    const patchValue = patch[key]
    const baseValue = result[key]

    if (key === 'folders' && isPlainObject(patchValue)) {
      const baseFolders = isPlainObject(baseValue) ? baseValue : {}
      result[key] = mergeFoldersRecord(baseFolders, patchValue)
      continue
    }

    if (isPlainObject(patchValue) && isPlainObject(baseValue)) {
      result[key] = deepMergeMeta(baseValue, patchValue)
    } else {
      result[key] = patchValue
    }
  }

  return result
}
