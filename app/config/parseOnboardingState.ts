export type OnboardingSlide = 1 | 2 | 3 | 4 | 5

export type OnboardingState = {
  completed: boolean
  currentSlide: OnboardingSlide
  selectedImportPluginId?: string
}

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  completed: false,
  currentSlide: 1,
}

function isOnboardingSlide(value: unknown): value is OnboardingSlide {
  return (
    Number.isInteger(value) &&
    value !== null &&
    Number(value) >= 1 &&
    Number(value) <= 5
  )
}

export function parseOnboardingState(value: unknown): OnboardingState {
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_ONBOARDING_STATE
  }

  const obj = value as Record<string, unknown>
  const completed = obj.completed === true
  const currentSlide = isOnboardingSlide(obj.currentSlide)
    ? obj.currentSlide
    : DEFAULT_ONBOARDING_STATE.currentSlide
  const selectedImportPluginId =
    typeof obj.selectedImportPluginId === 'string' &&
    obj.selectedImportPluginId.trim().length > 0
      ? obj.selectedImportPluginId.trim()
      : undefined

  return {
    completed,
    currentSlide: completed ? 5 : currentSlide,
    selectedImportPluginId,
  }
}
