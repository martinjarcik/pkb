import { describe, expect, it } from 'vitest'
import { isLocalEditorImageUrl } from '~/lib/editorjsImageToolLocalUrl'

describe('editorjsImageTool', () => {
  it('detects local asset image urls that need a filled-state fallback', () => {
    expect(isLocalEditorImageUrl('asset://localhost/path/to/image.png')).toBe(
      true,
    )
    expect(
      isLocalEditorImageUrl(
        'https://asset.localhost/Users/m.jarcik/Documents/Notes/assets/a.png',
      ),
    ).toBe(true)
    expect(isLocalEditorImageUrl('https://example.com/image.png')).toBe(false)
  })

  it('identifies blob: urls as local', () => {
    expect(isLocalEditorImageUrl('blob:http://localhost/abc')).toBe(true)
  })

  it('rejects arbitrary urls', () => {
    expect(isLocalEditorImageUrl('https://cdn.example.com/photo.jpg')).toBe(
      false,
    )
    expect(isLocalEditorImageUrl('')).toBe(false)
  })
})
