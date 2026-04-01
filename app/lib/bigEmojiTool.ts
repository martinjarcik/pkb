import type { API, SanitizerConfig } from '@editorjs/editorjs'
import 'emoji-picker-element'
import { BIG_EMOJI_CLASS } from './bigEmoji'

const ICON_MARKER = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>`
const CARET_ANCHOR = '\u200B'

type EmojiClickDetail = {
  unicode: string
}

type BigEmojiApi = API & {
  selection: {
    findParentTag(tagName: string, className?: string): HTMLElement | null
  }
  styles: {
    inlineToolButton: string
    inlineToolButtonActive: string
  }
}

export default class BigEmojiTool {
  static get isInline(): boolean {
    return true
  }

  static get title(): string {
    return 'Big Emoji'
  }

  static get CSS(): string {
    return BIG_EMOJI_CLASS
  }

  static get sanitize(): SanitizerConfig {
    return {
      strong: {
        class: BigEmojiTool.CSS,
      },
    }
  }

  private api: BigEmojiApi
  private actions: HTMLDivElement | null
  private button: HTMLButtonElement | null
  private floatingPicker: HTMLDivElement | null
  private savedRange: Range | null
  private tagName: string
  private targetBigEmoji: HTMLElement | null
  private toolbarOpen: boolean

  constructor({ api }: { api: API }) {
    this.api = api as BigEmojiApi
    this.actions = null
    this.button = null
    this.floatingPicker = null
    this.savedRange = null
    this.tagName = 'STRONG'
    this.targetBigEmoji = null
    this.toolbarOpen = false
    document.addEventListener('mousedown', this.handleDocumentMouseDown, true)
  }

  render(): HTMLButtonElement {
    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.classList.add(this.api.styles.inlineToolButton)
    this.button.innerHTML = ICON_MARKER
    this.button.setAttribute('aria-label', BigEmojiTool.title)

    return this.button
  }

  renderActions(): HTMLDivElement {
    this.actions = document.createElement('div')
    this.actions.className = 'big-emoji-actions-anchor'
    this.actions.hidden = true

    return this.actions
  }

  surround(range: Range): void {
    this.savedRange = range.cloneRange()

    if (this.toolbarOpen) {
      this.hideActions()
      this.syncButtonState(this.isActive())
      return
    }

    this.showActions()
    this.syncButtonState(true)
  }

  checkState(): boolean {
    const isActive = this.isActive()

    this.syncButtonState(isActive || this.toolbarOpen)

    if (!isActive && !this.toolbarOpen) {
      this.hideActions()
    }

    return isActive
  }

  clear(): void {
    if (this.toolbarOpen) {
      return
    }

    this.hideActions()
  }

  destroy(): void {
    document.removeEventListener(
      'mousedown',
      this.handleDocumentMouseDown,
      true,
    )
    this.floatingPicker?.remove()
    this.floatingPicker = null
  }

  private currentRange(): Range | null {
    const selection = window.getSelection()

    if (!selection || selection.rangeCount === 0) {
      return null
    }

    return selection.getRangeAt(0)
  }

  private findCurrentBigEmoji(): HTMLElement | null {
    return this.api.selection.findParentTag(this.tagName, BigEmojiTool.CSS)
  }

  private insertEmoji(emoji: string): void {
    const targetBigEmoji = this.targetBigEmoji

    if (targetBigEmoji) {
      targetBigEmoji.contentEditable = 'false'
      targetBigEmoji.textContent = emoji
      this.placeCaretAfter(targetBigEmoji)
      this.hideActions()
      this.syncButtonState(false)
      return
    }

    const range = this.restoreSavedRange()

    if (!range) {
      this.hideActions()
      this.syncButtonState(false)
      return
    }

    const currentBigEmoji = this.findCurrentBigEmoji()

    if (currentBigEmoji) {
      currentBigEmoji.contentEditable = 'false'
      currentBigEmoji.textContent = emoji
      this.placeCaretAfter(currentBigEmoji)
      this.hideActions()
      this.syncButtonState(false)
      return
    }

    const element = document.createElement(this.tagName)

    element.classList.add(BigEmojiTool.CSS)
    element.contentEditable = 'false'
    element.textContent = emoji
    range.deleteContents()
    range.insertNode(element)
    this.placeCaretAfter(element)
    this.hideActions()
    this.syncButtonState(false)
  }

  private restoreSavedRange(): Range | null {
    const range = this.savedRange ?? this.currentRange()
    const selection = window.getSelection()

    if (!range || !selection) {
      return null
    }

    selection.removeAllRanges()
    selection.addRange(range)

    return range
  }

  private placeCaretAfter(element: HTMLElement): void {
    const selection = window.getSelection()

    if (!selection) {
      return
    }

    const textNode = this.ensureTrailingCaretAnchor(element)
    const range = document.createRange()

    range.setStart(textNode, 0)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    this.savedRange = range.cloneRange()
    this.resetTypingStyle()
  }

  private ensureTrailingCaretAnchor(element: HTMLElement): Text {
    const nextSibling = element.nextSibling

    if (nextSibling instanceof Text) {
      return nextSibling
    }

    const anchor = document.createTextNode(CARET_ANCHOR)

    element.parentNode?.insertBefore(anchor, nextSibling)

    return anchor
  }

  private isActive(): boolean {
    return this.findCurrentBigEmoji() !== null
  }

  private showActions(): void {
    this.ensureFloatingPicker()

    if (!this.floatingPicker) {
      return
    }

    this.toolbarOpen = true
    this.floatingPicker.hidden = false
    this.positionFloatingPicker()
  }

  private hideActions(): void {
    if (!this.floatingPicker) {
      return
    }

    this.toolbarOpen = false
    this.targetBigEmoji = null
    this.floatingPicker.hidden = true
  }

  private syncButtonState(isActive: boolean): void {
    this.button?.classList.toggle(
      this.api.styles.inlineToolButtonActive,
      isActive,
    )
  }

  private resetTypingStyle(): void {
    if (typeof document.queryCommandState !== 'function') {
      return
    }

    if (document.queryCommandState('bold')) {
      document.execCommand('bold', false)
    }
  }

  private ensureFloatingPicker(): void {
    if (this.floatingPicker) {
      return
    }

    this.floatingPicker = document.createElement('div')
    this.floatingPicker.className = 'big-emoji-actions'
    this.floatingPicker.hidden = true

    const picker = document.createElement('emoji-picker')

    picker.addEventListener('emoji-click', (event: Event) => {
      const detail = (event as CustomEvent<EmojiClickDetail>).detail

      this.insertEmoji(detail.unicode)
    })
    this.floatingPicker.append(picker)
    document.body.append(this.floatingPicker)
  }

  private positionFloatingPicker(): void {
    if (!this.floatingPicker) {
      return
    }

    const anchor =
      this.targetBigEmoji ??
      this.button?.closest('.ce-inline-tool') ??
      this.button ??
      null

    if (!anchor) {
      return
    }

    const rect = anchor.getBoundingClientRect()
    const pickerWidth = this.floatingPicker.offsetWidth || 400
    const pickerHeight = this.floatingPicker.offsetHeight || 420
    const margin = 12
    const left = Math.min(
      Math.max(margin, rect.left),
      window.innerWidth - pickerWidth - margin,
    )
    const top = Math.min(
      rect.bottom + 8,
      window.innerHeight - pickerHeight - margin,
    )

    this.floatingPicker.style.left = `${left}px`
    this.floatingPicker.style.top = `${top}px`
  }

  private handleDocumentMouseDown = (event: MouseEvent): void => {
    const target = event.target

    if (!(target instanceof HTMLElement)) {
      return
    }

    if (
      this.floatingPicker?.contains(target) ||
      this.button?.contains(target) ||
      this.actions?.contains(target)
    ) {
      return
    }

    const bigEmoji = target.closest<HTMLElement>(`.${BigEmojiTool.CSS}`)

    if (!bigEmoji) {
      if (this.toolbarOpen) {
        this.hideActions()
        this.syncButtonState(false)
      }
      return
    }

    event.preventDefault()
    this.targetBigEmoji = bigEmoji
    this.showActions()
    this.syncButtonState(true)
  }
}
