import type { API, SanitizerConfig } from '@editorjs/editorjs'

type InlineHashtagApi = API & {
  selection: {
    expandToTag(element: HTMLElement): void
    findParentTag(tagName: string, className?: string): HTMLElement | null
  }
  styles: {
    inlineToolButton: string
    inlineToolButtonActive: string
  }
}

export default class InlineHashtagTool {
  static get isInline(): boolean {
    return true
  }

  static get title(): string {
    return 'Inline Hashtag'
  }

  static get CSS(): string {
    return 'inline-hashtag'
  }

  static get sanitize(): SanitizerConfig {
    return {
      span: {
        class: InlineHashtagTool.CSS,
      },
    }
  }

  private api: InlineHashtagApi
  private button: HTMLButtonElement | null
  private tagName: string

  constructor({ api }: { api: API }) {
    this.api = api as InlineHashtagApi
    this.button = null
    this.tagName = 'SPAN'
  }

  render(): HTMLButtonElement {
    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.classList.add(this.api.styles.inlineToolButton)
    this.button.innerHTML = '#'
    this.button.setAttribute('aria-label', InlineHashtagTool.title)

    return this.button
  }

  surround(range: Range): void {
    const parentTag = this.api.selection.findParentTag(
      this.tagName,
      InlineHashtagTool.CSS,
    )

    if (parentTag) {
      this.unwrap(parentTag)
      return
    }

    this.wrap(range)
  }

  checkState(): boolean {
    const parentTag = this.api.selection.findParentTag(
      this.tagName,
      InlineHashtagTool.CSS,
    )
    const isActive = parentTag !== null

    this.button?.classList.toggle(
      this.api.styles.inlineToolButtonActive,
      isActive,
    )

    return isActive
  }

  private wrap(range: Range): void {
    if (range.collapsed) {
      return
    }

    const span = document.createElement(this.tagName)

    span.classList.add(InlineHashtagTool.CSS)
    span.appendChild(range.extractContents())
    range.insertNode(span)
    this.api.selection.expandToTag(span)
  }

  private unwrap(parentTag: HTMLElement): void {
    const selection = window.getSelection()
    const range = document.createRange()
    const firstChild = parentTag.firstChild
    const lastChild = parentTag.lastChild
    const fragment = document.createDocumentFragment()

    while (parentTag.firstChild) {
      fragment.appendChild(parentTag.firstChild)
    }

    parentTag.parentNode?.replaceChild(fragment, parentTag)

    if (!selection || !firstChild || !lastChild) {
      return
    }

    range.setStartBefore(firstChild)
    range.setEndAfter(lastChild)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}
