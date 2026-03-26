import { describe, expect, it } from 'vitest'
import { extractTagsFromMarkdown } from '~/notes/extractTags'

describe('extractTagsFromMarkdown', () => {
  it('extracts a single hashtag', () => {
    expect(extractTagsFromMarkdown('hello #world')).toEqual(['world'])
  })

  it('extracts multiple hashtags in sorted order', () => {
    expect(extractTagsFromMarkdown('#foo bar #baz')).toEqual(['baz', 'foo'])
  })

  it('ignores headings', () => {
    expect(extractTagsFromMarkdown('# Title')).toEqual([])
  })

  it('ignores heading with multiple hashes', () => {
    expect(extractTagsFromMarkdown('## Subtitle')).toEqual([])
  })

  it('handles a hashtag at the start of the line', () => {
    expect(extractTagsFromMarkdown('#tag rest')).toEqual(['tag'])
  })

  it('deduplicates hashtags', () => {
    expect(extractTagsFromMarkdown('#foo #foo')).toEqual(['foo'])
  })

  it('strips the hash and lowercases tags', () => {
    expect(extractTagsFromMarkdown('#Engineering')).toEqual(['engineering'])
  })
})
