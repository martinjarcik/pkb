import { deepMergePlainObjects, type JsonObject } from './isPlainObject'

/**
 * Deep-merge patch into base (plain objects only). Patch values win; nested objects merge recursively.
 */
export function deepMergeAppConfig(
  base: JsonObject,
  patch: JsonObject,
): JsonObject {
  return deepMergePlainObjects(base, patch)
}
