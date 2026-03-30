import type { API, SanitizerConfig } from '@editorjs/editorjs'
import {
  INLINE_HIGHLIGHT_CLASS,
  INLINE_HIGHLIGHT_COLORS,
  INLINE_HIGHLIGHT_DEFAULT_COLOR,
  normalizeInlineHighlightColor,
  type InlineHighlightColor,
} from './inlineHighlight'

const ICON_MARKER = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" d="M11.3535 9.31802L12.7678 7.90381C13.5488 7.12276 14.8151 7.12276 15.5962 7.90381C16.3772 8.68486 16.3772 9.95119 15.5962 10.7322L14.182 12.1464M11.3535 9.31802L7.96729 12.7043C7.40889 13.2627 7.02826 13.9739 6.87339 14.7482L6.69798 15.6253C6.55803 16.325 7.17495 16.942 7.87467 16.802L8.75175 16.6266C9.52612 16.4717 10.2373 16.0911 10.7957 15.5327L14.182 12.1464M11.3535 9.31802L14.182 12.1464"/><line x1="15" x2="19" y1="17" y2="17" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>`
const ICON_CLEAR =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="1" y="1" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.25"/><path stroke="currentColor" stroke-linecap="round" stroke-width="1.25" d="M6 14L14 6"/></svg>'

type InlineHighlightApi = API & {
  selection: {
    expandToTag(element: HTMLElement): void
    findParentTag(tagName: string, className?: string): HTMLElement | null
  }
  styles: {
    inlineToolButton: string
    inlineToolButtonActive: string
  }
}

function darkenHexColor(color: string): string {
  const match = color.trim().match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i)

  if (!match) {
    return color
  }

  const hex = match[1]!
  const channels = [0, 2, 4].map((offset) =>
    Math.round(parseInt(hex.slice(offset, offset + 2), 16) * 0.82)
      .toString(16)
      .padStart(2, '0'),
  )

  return `#${channels.join('')}`
}

function swatchIcon(background: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="18" height="18" rx="2" fill="${background}" stroke="${darkenHexColor(background)}" stroke-width="1.25"/></svg>`
}

export default class InlineHighlightTool {
  static get isInline(): boolean {
    return true
  }

  static get title(): string {
    return 'Highlight'
  }

  static get CSS(): string {
    return INLINE_HIGHLIGHT_CLASS
  }

  static get sanitize(): SanitizerConfig {
    return {
      mark: {
        class: InlineHighlightTool.CSS,
        'data-color': true,
        style: true,
      },
    }
  }

  private api: InlineHighlightApi
  private actions: HTMLDivElement | null
  private button: HTMLButtonElement | null
  private colorButtons: Map<InlineHighlightColor, HTMLButtonElement>
  private tagName: string

  constructor({ api }: { api: API }) {
    this.api = api as InlineHighlightApi
    this.actions = null
    this.button = null
    this.colorButtons = new Map()
    this.tagName = 'MARK'
  }

  render(): HTMLButtonElement {
    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.classList.add(this.api.styles.inlineToolButton)
    this.button.innerHTML = ICON_MARKER
    this.button.setAttribute('aria-label', InlineHighlightTool.title)

    return this.button
  }

  surround(range: Range): void {
    const mark = this.findCurrentMark()

    if (mark) {
      this.removeHighlight(mark)
      return
    }

    const nextMark = this.wrap(range, INLINE_HIGHLIGHT_DEFAULT_COLOR)

    if (!nextMark) {
      return
    }

    this.showActions()
    this.syncButtonState(true)
  }

  checkState(): boolean {
    const isActive = this.isActive()

    this.syncButtonState(isActive)

    if (isActive) {
      this.showActions()
    } else {
      this.hideActions()
    }

    return isActive
  }

  renderActions(): HTMLDivElement {
    this.actions = document.createElement('div')
    this.actions.className = 'inline-highlight-actions'
    this.actions.hidden = true
    this.colorButtons.clear()

    const clearButton = document.createElement('button')
    clearButton.type = 'button'
    clearButton.className = 'inline-highlight-action'
    clearButton.innerHTML = ICON_CLEAR
    clearButton.setAttribute('aria-label', 'None')
    clearButton.title = 'None'
    clearButton.addEventListener('mousedown', (event) => {
      event.preventDefault()
    })
    clearButton.addEventListener('click', (event) => {
      event.preventDefault()
      const mark = this.findCurrentMark()

      if (mark) {
        this.removeHighlight(mark)
      }
    })
    this.actions.append(clearButton)

    for (const [color, meta] of Object.entries(INLINE_HIGHLIGHT_COLORS)) {
      const button = document.createElement('button')

      button.type = 'button'
      button.className = 'inline-highlight-action'
      button.innerHTML = swatchIcon(meta.background)
      button.setAttribute('aria-label', meta.label)
      button.title = meta.label
      button.dataset.color = color
      button.addEventListener('mousedown', (event) => {
        event.preventDefault()
      })
      button.addEventListener('click', (event) => {
        event.preventDefault()
        this.applyColor(color as InlineHighlightColor)
      })
      this.actions.append(button)
      this.colorButtons.set(color as InlineHighlightColor, button)
    }

    return this.actions
  }

  clear(): void {
    this.hideActions()
  }

  private applyColor(color: InlineHighlightColor): void {
    const mark = this.findCurrentMark()

    if (mark) {
      this.setColor(mark, color)
      this.showActions()
      return
    }

    const range = this.currentRange()

    if (!range || range.collapsed) {
      return
    }

    const nextMark = this.wrap(range, color)

    if (!nextMark) {
      return
    }

    this.showActions()
    this.syncButtonState(true)
  }

  private currentRange(): Range | null {
    const selection = window.getSelection()

    if (!selection || selection.rangeCount === 0) {
      return null
    }

    return selection.getRangeAt(0)
  }

  private findCurrentMark(): HTMLElement | null {
    return this.api.selection.findParentTag(
      this.tagName,
      InlineHighlightTool.CSS,
    )
  }

  private isActive(): boolean {
    return this.findCurrentMark() !== null
  }

  private currentColor(): InlineHighlightColor | null {
    const mark = this.findCurrentMark()

    if (!mark) {
      return null
    }

    return normalizeInlineHighlightColor(mark.dataset.color)
  }

  private wrap(range: Range, color: InlineHighlightColor): HTMLElement | null {
    if (range.collapsed) {
      return null
    }

    const mark = document.createElement(this.tagName)

    mark.classList.add(InlineHighlightTool.CSS)
    this.setColor(mark, color)
    mark.appendChild(range.extractContents())
    range.insertNode(mark)
    this.api.selection.expandToTag(mark)

    return mark
  }

  private setColor(element: HTMLElement, color: InlineHighlightColor): void {
    element.dataset.color = color
    element.style.backgroundColor = INLINE_HIGHLIGHT_COLORS[color]!.background
  }

  private removeHighlight(mark: HTMLElement): void {
    this.unwrap(mark)
    this.hideActions()
    this.syncButtonState(false)
  }

  private unwrap(mark: HTMLElement): void {
    const selection = window.getSelection()
    const range = document.createRange()
    const firstChild = mark.firstChild
    const lastChild = mark.lastChild
    const fragment = document.createDocumentFragment()

    while (mark.firstChild) {
      fragment.appendChild(mark.firstChild)
    }

    mark.parentNode?.replaceChild(fragment, mark)

    if (!selection || !firstChild || !lastChild) {
      return
    }

    range.setStartBefore(firstChild)
    range.setEndAfter(lastChild)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  private showActions(): void {
    if (!this.actions) {
      return
    }

    this.actions.hidden = false
    const currentColor = this.currentColor()

    for (const [color, button] of this.colorButtons.entries()) {
      button.dataset.state = color === currentColor ? 'active' : 'idle'
      button.setAttribute(
        'aria-pressed',
        color === currentColor ? 'true' : 'false',
      )
    }
  }

  private hideActions(): void {
    if (!this.actions) {
      return
    }

    this.actions.hidden = true
  }

  private syncButtonState(isActive: boolean): void {
    this.button?.classList.toggle(
      this.api.styles.inlineToolButtonActive,
      isActive,
    )
  }
}
