import { describe, expect, it } from 'vitest'
import {
  buildOnboardingStoragePatch,
  onboardingStateAfterFinish,
  onboardingStateAfterImport,
} from '~/composables/useOnboarding'

describe('useOnboarding helpers', () => {
  it('keeps filesystem storage when choosing the default vault', () => {
    expect(
      buildOnboardingStoragePatch({
        kind: 'default',
        defaultVault: './vault',
      }),
    ).toEqual({
      storageType: 'filesystem',
      vault: './vault',
    })
  })

  it('maps custom location to the filesystem vault path', () => {
    expect(
      buildOnboardingStoragePatch({
        kind: 'custom',
        vault: '/Users/m.jarcik/Documents/Notes',
      }),
    ).toEqual({
      storageType: 'filesystem',
      vault: '/Users/m.jarcik/Documents/Notes',
    })
  })

  it('maps iCloud setup to the filesystem vault path', () => {
    expect(
      buildOnboardingStoragePatch({
        kind: 'icloud',
        vault:
          '/Users/m.jarcik/Library/Mobile Documents/com~apple~CloudDocs/Notes',
      }),
    ).toEqual({
      storageType: 'filesystem',
      vault:
        '/Users/m.jarcik/Library/Mobile Documents/com~apple~CloudDocs/Notes',
    })
  })

  it('moves to slide 4 after a successful import', () => {
    expect(
      onboardingStateAfterImport(
        {
          completed: false,
          currentSlide: 3,
        },
        true,
        'notion',
      ),
    ).toEqual({
      completed: false,
      currentSlide: 4,
      selectedImportPluginId: 'notion',
    })
  })

  it('stays on slide 3 after a failed import', () => {
    expect(
      onboardingStateAfterImport(
        {
          completed: false,
          currentSlide: 3,
        },
        false,
        'notion',
      ),
    ).toEqual({
      completed: false,
      currentSlide: 3,
      selectedImportPluginId: 'notion',
    })
  })

  it('does not complete onboarding before slide 5', () => {
    expect(
      onboardingStateAfterFinish({
        completed: false,
        currentSlide: 4,
      }),
    ).toEqual({
      completed: false,
      currentSlide: 4,
    })
  })

  it('completes onboarding on slide 5', () => {
    expect(
      onboardingStateAfterFinish({
        completed: false,
        currentSlide: 5,
      }),
    ).toEqual({
      completed: true,
      currentSlide: 5,
    })
  })
})
