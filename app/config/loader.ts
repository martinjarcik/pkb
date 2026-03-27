import yaml from 'yaml'
import rawDefaultConfig from './default.yaml?raw'
import { parseAppConfig, type AppConfig } from './parseAppConfig'

export type { AppConfig, ApplicationType } from './parseAppConfig'
export { parseAppConfig } from './parseAppConfig'

const DEFAULT_CONFIG = parseAppConfig(yaml.parse(rawDefaultConfig) as unknown)

export function loadConfig(): AppConfig {
  return DEFAULT_CONFIG
}
