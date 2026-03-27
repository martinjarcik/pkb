import { resolve } from 'node:path'

export function getDefaultConfigPath(): string {
  return resolve(process.cwd(), 'app/config/default.yaml')
}

export function getUserConfigPath(): string {
  const override = process.env.PKB_APP_CONFIG_PATH

  if (typeof override === 'string' && override.trim().length > 0) {
    return resolve(process.cwd(), override.trim())
  }

  return resolve(process.cwd(), 'data/app-config.yaml')
}
