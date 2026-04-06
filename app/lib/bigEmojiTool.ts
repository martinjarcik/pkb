import type { API, SanitizerConfig } from '@editorjs/editorjs'
import {
  BIG_EMOJI_BIG_CLASS,
  BIG_EMOJI_BIG_MARKER,
  BIG_EMOJI_BIG_SIZE,
  BIG_EMOJI_CLASS,
  stripBigEmojiBigMarker,
  type BigEmojiSize,
} from './bigEmoji'

// Use a tiny visible-width editor-only anchor so the caret can land after an
// inline big emoji at line end. The serializer strips it back out on save.
const CARET_ANCHOR = '\u200A'

const EMOJI_SEGMENT_PATTERN =
  /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/u

let onBigEmojiChange: (() => void) | null = null

export function setBigEmojiChangeHandler(handler: (() => void) | null): void {
  onBigEmojiChange = handler
}

type BigEmojiApi = API & {
  selection: {
    findParentTag(tagName: string, className?: string): HTMLElement | null
  }
}

type BigEmojiTarget =
  | {
      kind: 'plain'
      range: Range
      emoji: string
      block: Element | null | undefined
    }
  | {
      kind: 'big'
      element: HTMLElement
      block: Element | null | undefined
    }

const BIG_EMOJI_SANITIZE_CLASSES = [
  BIG_EMOJI_CLASS,
  BIG_EMOJI_BIG_CLASS,
] as unknown as string

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
      span: {
        class: BIG_EMOJI_SANITIZE_CLASSES,
        'data-size': true,
      },
      b: {
        class: BIG_EMOJI_SANITIZE_CLASSES,
        'data-size': true,
      },
      strong: {
        class: BIG_EMOJI_SANITIZE_CLASSES,
        'data-size': true,
      },
    }
  }

  private api: BigEmojiApi
  private button: HTMLButtonElement | null
  private cursorOverEmoji: boolean
  private floatingActions: HTMLDivElement | null
  private defaultActionButton: HTMLButtonElement | null
  private biggerActionButton: HTMLButtonElement | null
  private bigActionButton: HTMLButtonElement | null
  private pendingTarget: BigEmojiTarget | null

  constructor({ api }: { api: API }) {
    this.api = api as BigEmojiApi
    this.button = null
    this.cursorOverEmoji = false
    this.floatingActions = null
    this.defaultActionButton = null
    this.biggerActionButton = null
    this.bigActionButton = null
    this.pendingTarget = null
    document.addEventListener('mousedown', this.handleDocumentMouseDown, true)
    document.addEventListener('click', this.handleClick, true)
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('scroll', this.hideActions, true)
    window.addEventListener('resize', this.hideActions)
  }

  render(): HTMLButtonElement {
    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.hidden = true
    return this.button
  }

  renderActions(): HTMLDivElement {
    const el = document.createElement('div')
    el.hidden = true
    return el
  }

  surround(): void {}
  checkState(): boolean {
    return false
  }
  clear(): void {}

  destroy(): void {
    document.removeEventListener(
      'mousedown',
      this.handleDocumentMouseDown,
      true,
    )
    document.removeEventListener('click', this.handleClick, true)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('scroll', this.hideActions, true)
    window.removeEventListener('resize', this.hideActions)
    this.floatingActions?.remove()
    this.floatingActions = null
    this.defaultActionButton = null
    this.biggerActionButton = null
    this.bigActionButton = null
    this.setCursorStyle(false)
  }

  private isInsideEditor(target: HTMLElement): boolean {
    return target.closest('.note-editor-surface') !== null
  }

  private isInsideNoteTitle(target: Node | null): boolean {
    const element =
      target instanceof Element
        ? target
        : target?.parentNode instanceof Element
          ? target.parentNode
          : null

    return element?.closest('[data-note-title]') !== null
  }

  private handleClick = (event: MouseEvent): void => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (!this.isInsideEditor(target)) return
    if (this.isInsideNoteTitle(target)) return

    const bigEmoji = this.findBigEmojiAtPoint(event.clientX, event.clientY)
    if (bigEmoji) {
      event.preventDefault()
      event.stopPropagation()
      const block = bigEmoji.closest('[contenteditable="true"]')
      this.showActions(
        {
          kind: 'big',
          element: bigEmoji,
          block,
        },
        bigEmoji.getBoundingClientRect(),
      )
      return
    }

    const emojiHit = this.findEmojiAtPoint(event.clientX, event.clientY)
    if (emojiHit) {
      event.preventDefault()
      event.stopPropagation()
      const block = emojiHit.range.startContainer.parentElement?.closest(
        '[contenteditable="true"]',
      )
      this.showActions(
        {
          kind: 'plain',
          range: emojiHit.range.cloneRange(),
          emoji: emojiHit.emoji,
          block,
        },
        emojiHit.range.getBoundingClientRect(),
      )
    }
  }

  private handleDocumentMouseDown = (event: MouseEvent): void => {
    const target = event.target

    if (!(target instanceof HTMLElement)) {
      this.hideActions()
      return
    }

    if (this.floatingActions?.contains(target)) {
      return
    }

    this.hideActions()
  }

  private notifyBlockChanged(block: Element | null | undefined): void {
    block?.dispatchEvent(new Event('input', { bubbles: true }))
    onBigEmojiChange?.()
  }

  private handleMouseMove = (event: MouseEvent): void => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      this.setCursorStyle(false)
      return
    }

    if (!this.isInsideEditor(target)) {
      this.setCursorStyle(false)
      return
    }

    if (this.isInsideNoteTitle(target)) {
      this.setCursorStyle(false)
      return
    }

    if (this.findBigEmojiAtPoint(event.clientX, event.clientY)) {
      this.setCursorStyle(true)
      return
    }

    const range = this.caretRangeFromPoint(event.clientX, event.clientY)
    if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) {
      this.setCursorStyle(false)
      return
    }

    const text = range.startContainer.textContent ?? ''
    const isOverEmoji =
      this.findEmojiSegmentAt(text, range.startOffset) !== null
    this.setCursorStyle(isOverEmoji)
  }

  private setCursorStyle(pointer: boolean): void {
    if (pointer === this.cursorOverEmoji) return
    this.cursorOverEmoji = pointer
    const surface = document.querySelector<HTMLElement>('.note-editor-surface')
    if (!surface) return
    surface.style.cursor = pointer ? 'pointer' : ''
  }

  private findBigEmojiAtPoint(x: number, y: number): HTMLElement | null {
    const el = document.elementFromPoint(x, y)
    if (!(el instanceof HTMLElement)) return null
    if (this.isInsideNoteTitle(el)) return null
    return el.closest<HTMLElement>(`.${BigEmojiTool.CSS}`)
  }

  private findEmojiAtPoint(
    x: number,
    y: number,
  ): {
    range: Range
    emoji: string
  } | null {
    const range = this.caretRangeFromPoint(x, y)
    if (!range) return null

    const node = range.startContainer
    if (node.nodeType !== Node.TEXT_NODE) return null
    if (this.isInsideNoteTitle(node)) return null

    const parentBigEmoji = node.parentElement?.closest<HTMLElement>(
      `.${BigEmojiTool.CSS}`,
    )
    if (parentBigEmoji) return null

    const text = node.textContent ?? ''
    const offset = range.startOffset
    const match = this.findEmojiSegmentAt(text, offset)
    if (!match) return null

    const emojiRange = document.createRange()
    emojiRange.setStart(node, match.start)
    emojiRange.setEnd(node, match.end)
    return { range: emojiRange, emoji: match.emoji }
  }

  private showActions(target: BigEmojiTarget, anchorRect: DOMRect): void {
    this.ensureFloatingActions()

    if (!this.floatingActions) {
      return
    }

    this.pendingTarget = target
    this.syncActionButtons()
    this.floatingActions.hidden = false
    this.positionFloatingActions(anchorRect)
  }

  private hideActions = (_event?: Event): void => {
    if (!this.floatingActions) {
      return
    }

    this.floatingActions.hidden = true
    this.pendingTarget = null
  }

  private ensureFloatingActions(): void {
    if (this.floatingActions) {
      return
    }

    const actions = document.createElement('div')
    actions.className = 'big-emoji-actions'
    actions.hidden = true

    const defaultButton = this.createActionButton('Default', () =>
      this.applyDefaultSize(),
    )
    const biggerButton = this.createActionButton('Bigger', () =>
      this.applyBiggerSize(),
    )
    const bigButton = this.createActionButton('Big', () => this.applyBigSize())

    actions.append(defaultButton, biggerButton, bigButton)
    document.body.append(actions)

    this.floatingActions = actions
    this.defaultActionButton = defaultButton
    this.biggerActionButton = biggerButton
    this.bigActionButton = bigButton
  }

  private createActionButton(
    label: string,
    onClick: () => void,
  ): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'big-emoji-action'
    button.textContent = label
    button.dataset.state = 'idle'
    button.setAttribute('aria-pressed', 'false')
    button.addEventListener('mousedown', (event) => {
      event.preventDefault()
      event.stopPropagation()
    })
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      onClick()
    })
    return button
  }

  private syncActionButtons(): void {
    const isPlain = this.pendingTarget?.kind === 'plain'
    const currentSize = this.currentPendingSize()
    const isBigger =
      this.pendingTarget?.kind === 'big' && currentSize === 'bigger'
    const isBig = this.pendingTarget?.kind === 'big' && currentSize === 'big'

    if (this.defaultActionButton) {
      this.defaultActionButton.dataset.state = isPlain ? 'active' : 'idle'
      this.defaultActionButton.setAttribute(
        'aria-pressed',
        isPlain ? 'true' : 'false',
      )
    }

    if (this.biggerActionButton) {
      this.biggerActionButton.dataset.state = isBigger ? 'active' : 'idle'
      this.biggerActionButton.setAttribute(
        'aria-pressed',
        isBigger ? 'true' : 'false',
      )
    }

    if (this.bigActionButton) {
      this.bigActionButton.dataset.state = isBig ? 'active' : 'idle'
      this.bigActionButton.setAttribute(
        'aria-pressed',
        isBig ? 'true' : 'false',
      )
    }
  }

  private positionFloatingActions(anchorRect: DOMRect): void {
    if (!this.floatingActions) {
      return
    }

    const actionsWidth = this.floatingActions.offsetWidth || 148
    const actionsHeight = this.floatingActions.offsetHeight || 36
    const margin = 12
    const centeredLeft =
      anchorRect.left + anchorRect.width / 2 - actionsWidth / 2
    const left = Math.min(
      Math.max(margin, centeredLeft),
      window.innerWidth - actionsWidth - margin,
    )
    const aboveTop = anchorRect.top - actionsHeight - 8
    const top =
      aboveTop >= margin
        ? aboveTop
        : Math.min(
            anchorRect.bottom + 8,
            window.innerHeight - actionsHeight - margin,
          )

    this.floatingActions.style.left = `${left}px`
    this.floatingActions.style.top = `${top}px`
  }

  private applyDefaultSize(): void {
    const target = this.pendingTarget

    if (!target) {
      return
    }

    if (target.kind === 'big') {
      this.unwrapBigEmoji(target.element)
      this.notifyBlockChanged(target.block)
    }

    this.hideActions()
  }

  private applyBiggerSize(): void {
    const target = this.pendingTarget

    if (!target) {
      return
    }

    if (target.kind === 'plain') {
      this.wrapAsEmoji(target.range, target.emoji, 'bigger')
      this.notifyBlockChanged(target.block)
    } else {
      this.setBigEmojiSize(target.element, 'bigger')
      this.notifyBlockChanged(target.block)
    }

    this.hideActions()
  }

  private applyBigSize(): void {
    const target = this.pendingTarget

    if (!target) {
      return
    }

    if (target.kind === 'plain') {
      this.wrapAsEmoji(target.range, target.emoji, 'big')
      this.notifyBlockChanged(target.block)
    } else {
      this.setBigEmojiSize(target.element, 'big')
      this.notifyBlockChanged(target.block)
    }

    this.hideActions()
  }

  private findEmojiSegmentAt(
    text: string,
    offset: number,
  ): { emoji: string; start: number; end: number } | null {
    const regex = new RegExp(EMOJI_SEGMENT_PATTERN.source, 'gu')
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      const start = match.index
      const end = start + match[0].length
      if (offset >= start && offset <= end) {
        return { emoji: match[0], start, end }
      }
    }

    return null
  }

  private caretRangeFromPoint(x: number, y: number): Range | null {
    if (typeof document.caretRangeFromPoint === 'function') {
      return document.caretRangeFromPoint(x, y)
    }
    return null
  }

  private wrapAsEmoji(
    range: Range,
    emoji: string,
    size: BigEmojiSize = 'bigger',
  ): void {
    const element = this.createBigEmojiElement(emoji, size)
    range.deleteContents()
    range.insertNode(element)
    this.placeCaretAfter(element)
  }

  private currentPendingSize(): BigEmojiSize | null {
    if (this.pendingTarget?.kind !== 'big') {
      return null
    }

    return this.getBigEmojiSize(this.pendingTarget.element)
  }

  private getBigEmojiSize(element: HTMLElement): BigEmojiSize {
    return element.classList.contains(BIG_EMOJI_BIG_CLASS) ||
      (element.textContent?.includes(BIG_EMOJI_BIG_MARKER) ?? false) ||
      element.tagName === 'STRONG' ||
      element.dataset.size === BIG_EMOJI_BIG_SIZE
      ? 'big'
      : 'bigger'
  }

  private createBigEmojiElement(
    emoji: string,
    size: BigEmojiSize,
  ): HTMLElement {
    const element = document.createElement('B')
    element.classList.add(BigEmojiTool.CSS)
    if (size === 'big') {
      element.classList.add(BIG_EMOJI_BIG_CLASS)
      element.dataset.size = BIG_EMOJI_BIG_SIZE
      element.textContent = `${emoji}${BIG_EMOJI_BIG_MARKER}`
    } else {
      delete element.dataset.size
      element.textContent = emoji
    }
    element.contentEditable = 'false'
    return element
  }

  private setBigEmojiSize(element: HTMLElement, size: BigEmojiSize): void {
    const textContent = element.textContent ?? ''
    const hasBigMarker = textContent.includes(BIG_EMOJI_BIG_MARKER)
    const alreadySized =
      size === 'big'
        ? element.classList.contains(BIG_EMOJI_BIG_CLASS) &&
          element.dataset.size === BIG_EMOJI_BIG_SIZE &&
          hasBigMarker
        : !element.classList.contains(BIG_EMOJI_BIG_CLASS) &&
          !element.dataset.size &&
          !hasBigMarker

    if (alreadySized) {
      return
    }

    const replacement = this.createBigEmojiElement(
      stripBigEmojiBigMarker(textContent),
      size,
    )
    element.parentNode?.replaceChild(replacement, element)
  }

  private unwrapBigEmoji(element: HTMLElement): void {
    const emoji = stripBigEmojiBigMarker(element.textContent ?? '')
    const textNode = document.createTextNode(emoji)
    element.parentNode?.replaceChild(textNode, element)
    this.placeCaretAfterText(textNode)
  }

  private placeCaretAfter(element: HTMLElement): void {
    const selection = window.getSelection()
    if (!selection) return

    const textNode = this.ensureTrailingCaretAnchor(element)
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    this.resetTypingStyle()
  }

  private placeCaretAfterText(textNode: Text): void {
    const selection = window.getSelection()
    if (!selection) return

    const range = document.createRange()
    range.setStartAfter(textNode)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
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

  private resetTypingStyle(): void {
    if (typeof document.queryCommandState !== 'function') return
    if (document.queryCommandState('bold')) {
      document.execCommand('bold', false)
    }
  }
}
