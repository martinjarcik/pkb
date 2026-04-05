import { describe, expect, it } from 'vitest'
import {
  catalogRowIsTrashed,
  trashExpired,
  withoutTrashedAt,
} from '~/notes/trash'

describe('catalogRowIsTrashed', () => {
  it('returns false when trashedAt is missing', () => {
    expect(catalogRowIsTrashed({})).toBe(false)
  })

  it('returns false when trashedAt is empty string', () => {
    expect(catalogRowIsTrashed({ trashedAt: '' })).toBe(false)
  })

  it('returns true when trashedAt is a non-empty string', () => {
    expect(catalogRowIsTrashed({ trashedAt: '2026-01-01T00:00:00.000Z' })).toBe(
      true,
    )
  })
})

describe('trashExpired', () => {
  it('returns false for invalid date strings', () => {
    expect(
      trashExpired('not-a-date', 30, new Date('2026-06-01T00:00:00.000Z')),
    ).toBe(false)
  })

  it('returns false before retention elapses', () => {
    expect(
      trashExpired(
        '2026-05-25T00:00:00.000Z',
        30,
        new Date('2026-06-01T00:00:00.000Z'),
      ),
    ).toBe(false)
  })

  it('returns true on or after retention elapses', () => {
    expect(
      trashExpired(
        '2020-01-01T00:00:00.000Z',
        30,
        new Date('2026-06-01T00:00:00.000Z'),
      ),
    ).toBe(true)
  })
})

describe('withoutTrashedAt', () => {
  it('removes trashedAt from properties', () => {
    expect(
      withoutTrashedAt({
        trashedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toEqual({})
  })
})
