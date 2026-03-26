import type { API, BlockAPI, ToolConfig } from '@editorjs/editorjs'

type NoteTitleData = {
  text: string
}

type NoteTitleConfig = ToolConfig & {
  ariaLabel?: string
  placeholder?: string
}

type NoteTitleParams = {
  api: API
  block: BlockAPI
  config: NoteTitleConfig
  data: NoteTitleData
  readOnly: boolean
}

type MoveEventDetails = {
  detail: {
    toIndex: number
  }
}

type NoteTitleApi = API & {
  toolbar: {
    close(): void
  }
}

export default class NoteTitleTool {
  private static isRestoringPosition = false

  static get enableLineBreaks(): boolean {
    return true
  }

  static get isReadOnlySupported(): boolean {
    return true
  }

  private api: NoteTitleApi
  private block: BlockAPI
  private readOnly: boolean
  private ariaLabel: string
  private placeholder: string
  private data: NoteTitleData
  private element: HTMLDivElement | null

  constructor({ api, block, config, data, readOnly }: NoteTitleParams) {
    this.api = api as NoteTitleApi
    this.block = block
    this.readOnly = readOnly
    this.ariaLabel = config.ariaLabel ?? 'Note title'
    this.placeholder = config.placeholder ?? ''
    this.data = {
      text: data?.text ?? '',
    }
    this.element = null
  }

  render(): HTMLDivElement {
    this.element = document.createElement('div')
    this.element.classList.add('note-title-shell', 'ce-note-title')
    this.element.contentEditable = this.readOnly ? 'false' : 'true'
    this.element.dataset.noteTitle = 'true'
    this.element.dataset.testid = 'note-title'
    this.element.setAttribute('aria-label', this.ariaLabel)
    this.element.setAttribute('role', 'textbox')
    this.element.spellcheck = false

    if (this.placeholder) {
      this.element.dataset.placeholder = this.placeholder
    }

    this.element.textContent = this.data.text

    if (!this.readOnly) {
      this.element.addEventListener('focus', this.handleToolbarEvent)
      this.element.addEventListener('keydown', this.handleKeydown)
      this.element.addEventListener('mouseenter', this.suppressBubbling)
      this.element.addEventListener('mousemove', this.suppressBubbling)
      this.element.addEventListener('mouseover', this.suppressBubbling)
      this.element.addEventListener('paste', this.handlePaste)
      this.element.addEventListener('pointerdown', this.suppressBubbling)
      this.element.addEventListener('pointerenter', this.suppressBubbling)
      this.element.addEventListener('pointermove', this.suppressBubbling)
      this.element.addEventListener('pointerover', this.suppressBubbling)
    }

    return this.element
  }

  save(element: HTMLDivElement): NoteTitleData {
    return {
      text: element.textContent ?? '',
    }
  }

  validate(): boolean {
    return true
  }

  destroy(): void {
    if (!this.element) {
      return
    }

    this.element.removeEventListener('focus', this.handleToolbarEvent)
    this.element.removeEventListener('keydown', this.handleKeydown)
    this.element.removeEventListener('mouseenter', this.suppressBubbling)
    this.element.removeEventListener('mousemove', this.suppressBubbling)
    this.element.removeEventListener('mouseover', this.suppressBubbling)
    this.element.removeEventListener('paste', this.handlePaste)
    this.element.removeEventListener('pointerdown', this.suppressBubbling)
    this.element.removeEventListener('pointerenter', this.suppressBubbling)
    this.element.removeEventListener('pointermove', this.suppressBubbling)
    this.element.removeEventListener('pointerover', this.suppressBubbling)
    this.element = null
  }

  moved(event: MoveEventDetails): void {
    if (
      NoteTitleTool.isRestoringPosition ||
      event.detail.toIndex === 0 ||
      this.readOnly
    ) {
      return
    }

    NoteTitleTool.isRestoringPosition = true

    window.requestAnimationFrame(() => {
      this.api.blocks.move(0, event.detail.toIndex)
      this.block.dispatchChange()

      window.requestAnimationFrame(() => {
        NoteTitleTool.isRestoringPosition = false
      })
    })
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    const nextIndex = this.api.blocks.getCurrentBlockIndex() + 1

    this.api.blocks.insert(
      'paragraph',
      {
        text: '',
      },
      undefined,
      nextIndex,
      true,
    )

    window.requestAnimationFrame(() => {
      this.api.caret.setToBlock(nextIndex, 'start', 0)
    })

    this.block.dispatchChange()
  }

  private handlePaste = (event: ClipboardEvent): void => {
    event.preventDefault()

    const text = event.clipboardData?.getData('text/plain') ?? ''
    document.execCommand('insertText', false, text.replace(/[\r\n]+/g, ' '))
    this.block.dispatchChange()
  }

  private suppressBubbling = (event: Event): void => {
    event.stopPropagation()
  }

  private handleToolbarEvent = (): void => {
    window.requestAnimationFrame(() => {
      this.api.toolbar.close()
    })
  }
}
