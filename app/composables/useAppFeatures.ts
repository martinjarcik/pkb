import { loadConfig } from '~/config/loader'

const defaultFeatures = loadConfig().features

export function useAppFeatures() {
  return {
    favorites: defaultFeatures.favorites,
    tasks: defaultFeatures.tasks,
    pinned: defaultFeatures.pinned,
    nonDistractionMode: defaultFeatures.nonDistractionMode,
    noteWebhook: defaultFeatures.noteWebhook,
  }
}
