import { describe, expect, it } from 'vitest'
import { extractLocalImageRefs, orphanedImageRefs } from '~/storage/imageRefs'

describe('extractLocalImageRefs', () => {
  it('extracts a single local image reference', () => {
    expect(extractLocalImageRefs('![](assets/a.png)')).toEqual(
      new Set(['assets/a.png']),
    )
  })

  it('extracts multiple image references', () => {
    const md = '![](assets/a.png)\n\n![cap](assets/b.jpg)'

    expect(extractLocalImageRefs(md)).toEqual(
      new Set(['assets/a.png', 'assets/b.jpg']),
    )
  })

  it('ignores external URLs', () => {
    expect(extractLocalImageRefs('![](https://example.com/pic.png)')).toEqual(
      new Set(),
    )
  })

  it('ignores http URLs', () => {
    expect(extractLocalImageRefs('![](http://example.com/pic.png)')).toEqual(
      new Set(),
    )
  })

  it('ignores data URIs', () => {
    expect(extractLocalImageRefs('![](data:image/png;base64,abc)')).toEqual(
      new Set(),
    )
  })

  it('returns empty set for markdown with no images', () => {
    expect(extractLocalImageRefs('Hello world')).toEqual(new Set())
  })

  it('deduplicates repeated references', () => {
    const md = '![](assets/a.png)\n![](assets/a.png)'

    expect(extractLocalImageRefs(md)).toEqual(new Set(['assets/a.png']))
  })
})

describe('orphanedImageRefs', () => {
  it('returns refs removed between old and new content', () => {
    const old = '![](assets/a.png)\n![](assets/b.png)'
    const next = '![](assets/b.png)'

    expect(orphanedImageRefs(old, next)).toEqual(['assets/a.png'])
  })

  it('returns empty array when no refs were removed', () => {
    const old = '![](assets/a.png)'
    const next = '![](assets/a.png)\n![](assets/b.png)'

    expect(orphanedImageRefs(old, next)).toEqual([])
  })

  it('returns all old refs when new content has no images', () => {
    const old = '![](assets/a.png)\n![](assets/b.png)'

    expect(orphanedImageRefs(old, 'Hello')).toEqual([
      'assets/a.png',
      'assets/b.png',
    ])
  })

  it('returns empty array when both are empty', () => {
    expect(orphanedImageRefs('', '')).toEqual([])
  })
})
