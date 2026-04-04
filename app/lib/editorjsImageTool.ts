type EditorImageToolInstance = {
  ui?: {
    toggleStatus?: (status: string) => void
    nodes?: {
      imagePreloader?: { style: { backgroundImage: string } }
    }
  }
}

type EditorImageToolClass = new (...args: never[]) => unknown

const LOCAL_ASSET_URL_PREFIXES = [
  'asset://',
  'blob:',
  'http://asset.localhost/',
  'https://asset.localhost/',
] as const

export function isLocalEditorImageUrl(url: string): boolean {
  return LOCAL_ASSET_URL_PREFIXES.some((prefix) => url.startsWith(prefix))
}

function forceFilledImageStatus(instance: EditorImageToolInstance): void {
  queueMicrotask(() => {
    instance.ui?.toggleStatus?.('filled')

    if (instance.ui?.nodes?.imagePreloader) {
      instance.ui.nodes.imagePreloader.style.backgroundImage = ''
    }
  })
}

export function patchEditorImageToolForLocalAssets<
  T extends EditorImageToolClass,
>(ImageTool: T): T {
  const prototype = ImageTool.prototype as EditorImageToolInstance & {
    __pkbLocalAssetPatchApplied?: boolean
    render?: (...args: never[]) => unknown
    data?: { file?: { url?: string } }
  }

  if (prototype.__pkbLocalAssetPatchApplied) {
    return ImageTool
  }

  const originalRender = prototype.render

  prototype.render = function patchedRender(
    this: EditorImageToolInstance,
  ): unknown {
    const result = originalRender?.call(this)
    const url = (this as { data?: { file?: { url?: string } } }).data?.file?.url

    if (typeof url === 'string' && isLocalEditorImageUrl(url)) {
      forceFilledImageStatus(this)
    }

    return result
  }

  const imageDescriptor = Object.getOwnPropertyDescriptor(prototype, 'image')

  if (imageDescriptor?.set) {
    Object.defineProperty(prototype, 'image', {
      ...imageDescriptor,
      set(this: EditorImageToolInstance, value: { url?: string } | undefined) {
        imageDescriptor.set!.call(this, value)

        if (
          typeof value?.url === 'string' &&
          isLocalEditorImageUrl(value.url)
        ) {
          forceFilledImageStatus(this)
        }
      },
    })
  }

  prototype.__pkbLocalAssetPatchApplied = true

  return ImageTool
}
