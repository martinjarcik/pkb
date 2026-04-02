import { describe, expect, it } from 'vitest'
import { deepMergePlainObjects, isPlainObject } from '~/config/isPlainObject'

describe('isPlainObject', () => {
  it('returns true for plain object literals', () => {
    expect(isPlainObject({ a: 1 })).toBe(true)
  })

  it('returns false for arrays', () => {
    expect(isPlainObject([])).toBe(false)
  })

  it('returns false for null', () => {
    expect(isPlainObject(null)).toBe(false)
  })

  it('returns false for class instances', () => {
    class Example {
      value = 1
    }

    expect(isPlainObject(new Example())).toBe(false)
  })
})

describe('deepMergePlainObjects', () => {
  it('merges nested plain-object fields recursively', () => {
    expect(
      deepMergePlainObjects(
        { layout: { showSidebarPanel: true, showInspectorPanel: true } },
        { layout: { showSidebarPanel: false } },
      ),
    ).toEqual({
      layout: {
        showSidebarPanel: false,
        showInspectorPanel: true,
      },
    })
  })

  it('replaces non-plain-object values directly', () => {
    expect(
      deepMergePlainObjects(
        { tags: ['a'], favorite: false },
        { tags: ['b'], favorite: true },
      ),
    ).toEqual({
      tags: ['b'],
      favorite: true,
    })
  })
})
