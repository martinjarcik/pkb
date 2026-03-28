import { resolve } from 'node:path'

export function getMetaPath(): string {
  const override = process.env.PKB_META_PATH

  if (typeof override === 'string' && override.trim().length > 0) {
    return resolve(process.cwd(), override.trim())
  }

  return resolve(process.cwd(), 'meta.yaml')
}
