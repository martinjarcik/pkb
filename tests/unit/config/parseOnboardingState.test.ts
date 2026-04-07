import { describe, expect, it } from 'vitest'
import { parseOnboardingState } from '~/config/parseOnboardingState'

describe('parseOnboardingState', () => {
  it('defaults to slide 1 when onboarding state is missing', () => {
    expect(parseOnboardingState(undefined)).toEqual({
      completed: false,
      currentSlide: 1,
    })
  })

  it('preserves the persisted slide for incomplete onboarding', () => {
    expect(
      parseOnboardingState({
        completed: false,
        currentSlide: 4,
        selectedImportPluginId: 'notion',
      }),
    ).toEqual({
      completed: false,
      currentSlide: 4,
      selectedImportPluginId: 'notion',
    })
  })

  it('forces completed onboarding to slide 5', () => {
    expect(
      parseOnboardingState({
        completed: true,
        currentSlide: 2,
      }),
    ).toEqual({
      completed: true,
      currentSlide: 5,
    })
  })
})
