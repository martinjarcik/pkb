import { describe, expect, it, vi } from 'vitest'
import {
  isLocalEditorImageUrl,
  patchEditorImageToolForLocalAssets,
} from '~/lib/editorjsImageTool'

type MockImageToolData = {
  file?: {
    url?: string
  }
}

class MockImageTool {
  ui = {
    toggleStatus: vi.fn(),
    nodes: {
      imagePreloader: {
        style: {
          backgroundImage: 'url(preview)',
        },
      },
    },
  }

  private imageValue: MockImageToolData['file'] = { url: '' }

  get data(): MockImageToolData {
    return {
      file: this.imageValue,
    }
  }

  set image(value: MockImageToolData['file']) {
    this.imageValue = value
  }

  render(): string {
    return 'rendered'
  }
}

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

  it('forces the image tool into filled state for local asset urls on render', async () => {
    const PatchedImageTool = patchEditorImageToolForLocalAssets(MockImageTool)
    const tool = new PatchedImageTool()

    tool.image = { url: 'asset://localhost/path/to/image.png' }
    tool.render()
    await Promise.resolve()

    expect(tool.ui.toggleStatus).toHaveBeenCalledWith('filled')
    expect(tool.ui.nodes.imagePreloader.style.backgroundImage).toBe('')
  })

  it('does not force the filled state for normal remote urls', async () => {
    const PatchedImageTool = patchEditorImageToolForLocalAssets(MockImageTool)
    const tool = new PatchedImageTool()

    tool.image = { url: 'https://example.com/image.png' }
    tool.render()
    await Promise.resolve()

    expect(tool.ui.toggleStatus).not.toHaveBeenCalled()
    expect(tool.ui.nodes.imagePreloader.style.backgroundImage).toBe(
      'url(preview)',
    )
  })
})
