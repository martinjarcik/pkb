import { ref } from 'vue'

export type SettingsCategory =
  | 'general'
  | 'features'
  | 'editing'
  | 'theme'
  | 'development'

const settingsOpen = ref(false)
const activeCategory = ref<SettingsCategory>('general')

export function useSettings() {
  function openSettings(category: SettingsCategory = 'general'): void {
    activeCategory.value = category
    settingsOpen.value = true
  }

  function closeSettings(): void {
    settingsOpen.value = false
  }

  function selectSettingsCategory(category: SettingsCategory): void {
    activeCategory.value = category
  }

  return {
    settingsOpen,
    activeCategory,
    openSettings,
    closeSettings,
    selectSettingsCategory,
  }
}
