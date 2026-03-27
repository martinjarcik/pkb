import { describe, expect, it } from 'vitest'
import { detectHasTasks } from '~/notes/detectHasTasks'

describe('detectHasTasks', () => {
  it('returns true for unchecked checklist items', () => {
    expect(detectHasTasks('- [ ] todo')).toBe(true)
  })

  it('returns false for fully checked checklist items', () => {
    expect(detectHasTasks('- [x] done')).toBe(false)
  })

  it('returns false when content has no checklist items', () => {
    expect(detectHasTasks('regular paragraph text')).toBe(false)
  })

  it('returns true when checked and unchecked items are mixed', () => {
    expect(detectHasTasks('- [x] done\n- [ ] todo')).toBe(true)
  })
})
