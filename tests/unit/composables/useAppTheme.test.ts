import { describe, expect, it } from 'vitest'
import { pickBlackOrWhiteTextTone } from '~/composables/useAppTheme'

describe('pickBlackOrWhiteTextTone', () => {
  it('returns black text for light backgrounds', () => {
    expect(pickBlackOrWhiteTextTone('#fafafa')).toBe('black')
  })

  it('returns white text for dark backgrounds', () => {
    expect(pickBlackOrWhiteTextTone('#1f2937')).toBe('white')
  })

  it('uses the same rule for accent colors', () => {
    expect(pickBlackOrWhiteTextTone('#f4d35e')).toBe('black')
  })
})
