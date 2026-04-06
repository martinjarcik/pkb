import { describe, expect, it } from 'vitest'
import { rewriteAssetLinks, stripNotionSourceSuffix } from '~/import/notion'

describe('stripNotionSourceSuffix', () => {
  it('removes the trailing Notion suffix token', () => {
    expect(
      stripNotionSourceSuffix('My Note 32acd00a693f8018bfbad3c408c35094'),
    ).toBe('My Note')
  })

  it('removes trailing suffix tokens with non-hex endings', () => {
    expect(
      stripNotionSourceSuffix(
        'Meeting Notes 32acd00a693f8018bfbad3c408c35094_all',
      ),
    ).toBe('Meeting Notes')
  })

  it('keeps single-token titles unchanged', () => {
    expect(stripNotionSourceSuffix('SingleToken')).toBe('SingleToken')
  })
})

describe('rewriteAssetLinks', () => {
  it('rewrites URL-encoded Notion asset folder paths', () => {
    expect(
      rewriteAssetLinks(
        '![image](8%209/777846781_20230908074712_InBody.jpeg)',
        'assets',
        new Set(['8 9']),
      ),
    ).toBe('![image](assets/777846781_20230908074712_InBody.jpeg)')
  })

  it('rewrites raw Notion asset folder paths', () => {
    expect(
      rewriteAssetLinks(
        '![image](Supplements/image%201.png)',
        'assets',
        new Set(['Supplements']),
      ),
    ).toBe('![image](assets/image%201.png)')
  })
})
