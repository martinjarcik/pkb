import yaml from "yaml"
import rawDefaultConfig from "./default.yaml?raw"

export type AppConfig = {
  features: {
    metadata: boolean
  }
  theme: {
    accent: string
  }
  layout: {
    showSidebar: boolean
    showNoteList: boolean
  }
}

export function loadConfig(): AppConfig {
  return yaml.parse(rawDefaultConfig) as AppConfig
}