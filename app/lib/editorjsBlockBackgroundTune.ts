import type { API, BlockAPI } from '@editorjs/editorjs'
import {
  getBlockBackgroundColors,
  isBlockBackgroundColor,
  type BlockBackgroundColor,
} from './editorjsBlockBackground'
import { backgroundSwatchIcon } from './editorColorSwatch'
import { ICON_CLEAR } from './editorIcons'

type BlockBackgroundTuneData = {
  color?: string
}

type BlockBackgroundTuneParams = {
  api: API
  block: BlockAPI
  data: BlockBackgroundTuneData
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

const ICON_BACKGROUND =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 15.5L14.5 5a2.121 2.121 0 0 1 3 3L7 18.5H4v-3Z"/><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M13 7l4 4"/><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M4 20h16"/></svg>'

export default class EditorjsBlockBackgroundTune {
  static get isTune(): boolean {
    return true
  }

  private block: BlockAPI
  private color: BlockBackgroundColor | null
  private element: HTMLElement | null

  constructor({ block, data }: BlockBackgroundTuneParams) {
    this.block = block
    this.color = isBlockBackgroundColor(data?.color) ? data.color : null
    this.element = null
  }

  render(): MenuConfigItem {
    return {
      icon: ICON_BACKGROUND,
      title: 'Background color',
      children: {
        items: [
          {
            icon: ICON_CLEAR,
            title: 'None',
            onActivate: () => {
              this.setColor(null)
            },
            isActive: this.color === null,
            toggle: 'block-background-color',
            closeOnActivate: true,
          },
          ...Object.entries(getBlockBackgroundColors()).map(
            ([color, meta]) => ({
              icon: backgroundSwatchIcon(meta.background),
              title: meta.label,
              onActivate: () => {
                this.setColor(color as BlockBackgroundColor)
              },
              isActive: this.color === color,
              toggle: 'block-background-color',
              closeOnActivate: true,
            }),
          ),
        ],
      },
    }
  }

  wrap(blockContent: HTMLElement): HTMLElement {
    this.element = blockContent
    this.syncElement()

    return blockContent
  }

  save(): BlockBackgroundTuneData {
    return this.color ? { color: this.color } : {}
  }

  private setColor(color: BlockBackgroundColor | null): void {
    this.color = color
    this.syncElement()
    this.block.dispatchChange()
  }

  private syncElement(): void {
    if (!this.element) {
      return
    }

    this.element.classList.add('ce-block-background')

    if (!this.color) {
      delete this.element.dataset.blockBackgroundColor
      this.element.style.removeProperty('--editor-block-background-color')
      return
    }

    this.element.dataset.blockBackgroundColor = this.color
    this.element.style.setProperty(
      '--editor-block-background-color',
      getBlockBackgroundColors()[this.color]!.background,
    )
  }
}
