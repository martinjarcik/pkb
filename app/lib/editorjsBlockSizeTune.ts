import type { API, BlockAPI } from '@editorjs/editorjs'
import {
  BLOCK_SIZE_CLASS_PREFIX,
  extractBlockSizeFromCssClasses,
  isBlockSize,
  type BlockSize,
} from './editorjsBlockSize'

type BlockSizeTuneData = {
  size?: string
}

type BlockSizeTuneParams = {
  api: API
  block: BlockAPI
  data: BlockSizeTuneData
}

type MenuConfigItem = {
  icon: string
  title: string
  onActivate?: () => void
  isActive?: boolean
  toggle?: boolean | string
  closeOnActivate?: boolean
  children?: {
    items: MenuConfigItem[]
  }
}

const ICON_SIZE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M5 18h14"/><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M7.5 14.5 12 6l4.5 8.5"/><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M9.2 11.5h5.6"/></svg>'
const ICON_DEFAULT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="10" height="8" x="7" y="8" stroke="currentColor" stroke-width="2" rx="1.5"/></svg>'
const ICON_BIGGER =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="14" height="10" x="5" y="7" stroke="currentColor" stroke-width="2" rx="1.5"/></svg>'
const ICON_BIG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="18" height="12" x="3" y="6" stroke="currentColor" stroke-width="2" rx="1.5"/></svg>'

export default class EditorjsBlockSizeTune {
  static get isTune(): boolean {
    return true
  }

  private block: BlockAPI
  private size: BlockSize | null
  private element: HTMLElement | null

  constructor({ block, data }: BlockSizeTuneParams) {
    this.block = block
    this.size = isBlockSize(data?.size) ? data.size : null
    this.element = null
  }

  render(): MenuConfigItem {
    return {
      icon: ICON_SIZE,
      title: 'Size',
      children: {
        items: [
          {
            icon: ICON_DEFAULT,
            title: 'Default',
            onActivate: () => {
              this.setSize(null)
            },
            isActive: this.size === null,
            toggle: 'block-size',
            closeOnActivate: true,
          },
          {
            icon: ICON_BIGGER,
            title: 'Bigger',
            onActivate: () => {
              this.setSize('bigger')
            },
            isActive: this.size === 'bigger',
            toggle: 'block-size',
            closeOnActivate: true,
          },
          {
            icon: ICON_BIG,
            title: 'Big',
            onActivate: () => {
              this.setSize('big')
            },
            isActive: this.size === 'big',
            toggle: 'block-size',
            closeOnActivate: true,
          },
        ],
      },
    }
  }

  wrap(blockContent: HTMLElement): HTMLElement {
    this.element = blockContent

    const initialSize = extractBlockSizeFromCssClasses(
      Array.from(blockContent.classList),
    )

    if (initialSize && !this.size) {
      this.size = initialSize
    }

    this.syncElement()

    return blockContent
  }

  save(): BlockSizeTuneData {
    return this.size ? { size: this.size } : {}
  }

  private setSize(size: BlockSize | null): void {
    this.size = size
    this.syncElement()
    this.block.dispatchChange()
  }

  private syncElement(): void {
    if (!this.element) {
      return
    }

    this.element.classList.remove(
      `${BLOCK_SIZE_CLASS_PREFIX}bigger`,
      `${BLOCK_SIZE_CLASS_PREFIX}big`,
    )

    if (this.size) {
      this.element.classList.add(`${BLOCK_SIZE_CLASS_PREFIX}${this.size}`)
    }
  }
}
