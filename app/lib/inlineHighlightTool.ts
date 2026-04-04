import type { API, SanitizerConfig } from '@editorjs/editorjs'
import {
  INLINE_HIGHLIGHT_CLASS,
  getInlineHighlightDefaultColor,
  isInlineHighlightColor,
  type InlineHighlightColor,
  type InlineHighlightStyle,
} from './inlineHighlight'
import { getEditorColors } from './editorColors'
import { backgroundSwatchIcon } from './editorColorSwatch'
import { ICON_CLEAR } from './editorIcons'
import { unwrapInlineTag } from './editorjsInlineToolUtils'

const ICON_MARKER = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" d="M11.3535 9.31802L12.7678 7.90381C13.5488 7.12276 14.8151 7.12276 15.5962 7.90381C16.3772 8.68486 16.3772 9.95119 15.5962 10.7322L14.182 12.1464M11.3535 9.31802L7.96729 12.7043C7.40889 13.2627 7.02826 13.9739 6.87339 14.7482L6.69798 15.6253C6.55803 16.325 7.17495 16.942 7.87467 16.802L8.75175 16.6266C9.52612 16.4717 10.2373 16.0911 10.7957 15.5327L14.182 12.1464M11.3535 9.31802L14.182 12.1464"/><line x1="15" x2="19" y1="17" y2="17" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>`
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

function textSwatchIcon(textHex: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="18" height="18" rx="2" stroke="currentColor" stroke-width="0.75" stroke-opacity="0.15"/><text x="10" y="14.5" text-anchor="middle" font-size="12" font-weight="700" fill="${textHex}" font-family="system-ui, sans-serif">A</text></svg>`
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
        'data-bg': true,
        'data-text': true,
        'data-color': true,
        style: true,
      },
    }
  }

  private api: InlineHighlightApi
  private actions: HTMLDivElement | null
  private button: HTMLButtonElement | null
  private textColorButtons: Map<InlineHighlightColor, HTMLButtonElement>
  private bgColorButtons: Map<InlineHighlightColor, HTMLButtonElement>
  private tagName: string

  constructor({ api }: { api: API }) {
    this.api = api as InlineHighlightApi
    this.actions = null
    this.button = null
    this.textColorButtons = new Map()
    this.bgColorButtons = new Map()
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

    const defaultStyle: InlineHighlightStyle = {
      bgColor: getInlineHighlightDefaultColor(),
      textColor: null,
    }
    const nextMark = this.wrap(range, defaultStyle)

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
    this.textColorButtons.clear()
    this.bgColorButtons.clear()

    const textSection = this.buildSection(
      'Text color',
      'text',
      this.textColorButtons,
      (color) => this.applyTextColor(color),
      () => this.clearTextColor(),
    )
    this.actions.append(textSection)

    const spacer = document.createElement('div')
    spacer.className = 'inline-highlight-actions-spacer'
    this.actions.append(spacer)

    const bgSection = this.buildSection(
      'Highlight color',
      'bg',
      this.bgColorButtons,
      (color) => this.applyBgColor(color),
      () => this.clearBgColor(),
    )
    this.actions.append(bgSection)

    return this.actions
  }

  clear(): void {
    this.hideActions()
  }

  private buildSection(
    label: string,
    kind: 'text' | 'bg',
    buttonMap: Map<InlineHighlightColor, HTMLButtonElement>,
    onColor: (color: InlineHighlightColor) => void,
    onClear: () => void,
  ): HTMLDivElement {
    const section = document.createElement('div')
    section.className = 'inline-highlight-actions-section'

    const title = document.createElement('div')
    title.className = 'inline-highlight-actions-label'
    title.textContent = label
    section.append(title)

    const row = document.createElement('div')
    row.className = 'inline-highlight-actions-row'

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
      onClear()
    })
    row.append(clearButton)

    for (const [color, meta] of Object.entries(getEditorColors())) {
      const button = document.createElement('button')

      button.type = 'button'
      button.className = 'inline-highlight-action'
      button.innerHTML =
        kind === 'bg'
          ? backgroundSwatchIcon(meta.background)
          : textSwatchIcon(meta.text)
      button.setAttribute('aria-label', meta.label)
      button.title = meta.label
      button.dataset.color = color
      button.addEventListener('mousedown', (event) => {
        event.preventDefault()
      })
      button.addEventListener('click', (event) => {
        event.preventDefault()
        onColor(color as InlineHighlightColor)
      })
      row.append(button)
      buttonMap.set(color as InlineHighlightColor, button)
    }

    section.append(row)
    return section
  }

  private applyTextColor(color: InlineHighlightColor): void {
    const mark = this.findCurrentMark()

    if (mark) {
      const current = this.currentStyle(mark)
      this.setStyle(mark, { ...current, textColor: color })
      this.showActions()
      return
    }

    this.wrapWithStyle({ textColor: color, bgColor: null })
  }

  private applyBgColor(color: InlineHighlightColor): void {
    const mark = this.findCurrentMark()

    if (mark) {
      const current = this.currentStyle(mark)
      this.setStyle(mark, { ...current, bgColor: color })
      this.showActions()
      return
    }

    this.wrapWithStyle({ textColor: null, bgColor: color })
  }

  private clearTextColor(): void {
    const mark = this.findCurrentMark()

    if (!mark) {
      return
    }

    const current = this.currentStyle(mark)
    const nextStyle: InlineHighlightStyle = { ...current, textColor: null }

    if (!nextStyle.bgColor && !nextStyle.textColor) {
      this.removeHighlight(mark)
      return
    }

    this.setStyle(mark, nextStyle)
    this.showActions()
  }

  private clearBgColor(): void {
    const mark = this.findCurrentMark()

    if (!mark) {
      return
    }

    const current = this.currentStyle(mark)
    const nextStyle: InlineHighlightStyle = { ...current, bgColor: null }

    if (!nextStyle.bgColor && !nextStyle.textColor) {
      this.removeHighlight(mark)
      return
    }

    this.setStyle(mark, nextStyle)
    this.showActions()
  }

  private wrapWithStyle(style: InlineHighlightStyle): void {
    const range = this.currentRange()

    if (!range || range.collapsed) {
      return
    }

    const nextMark = this.wrap(range, style)

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

  private currentStyle(mark: HTMLElement): InlineHighlightStyle {
    const bgRaw = mark.dataset.bg
    const textRaw = mark.dataset.text
    const colorRaw = mark.dataset.color

    if (bgRaw || textRaw) {
      return {
        bgColor: bgRaw && isInlineHighlightColor(bgRaw) ? bgRaw : null,
        textColor: textRaw && isInlineHighlightColor(textRaw) ? textRaw : null,
      }
    }

    if (colorRaw && isInlineHighlightColor(colorRaw)) {
      return { bgColor: colorRaw, textColor: null }
    }

    return { bgColor: getInlineHighlightDefaultColor(), textColor: null }
  }

  private wrap(range: Range, style: InlineHighlightStyle): HTMLElement | null {
    if (range.collapsed) {
      return null
    }

    const mark = document.createElement(this.tagName)

    mark.classList.add(InlineHighlightTool.CSS)
    this.setStyle(mark, style)
    mark.appendChild(range.extractContents())
    range.insertNode(mark)
    this.api.selection.expandToTag(mark)

    return mark
  }

  private setStyle(element: HTMLElement, style: InlineHighlightStyle): void {
    delete element.dataset.color

    if (style.bgColor) {
      element.dataset.bg = style.bgColor
      element.style.backgroundColor =
        getEditorColors()[style.bgColor]!.background
    } else {
      delete element.dataset.bg
      element.style.backgroundColor = ''
    }

    if (style.textColor) {
      element.dataset.text = style.textColor
      element.style.color = getEditorColors()[style.textColor]!.text
    } else {
      delete element.dataset.text
      element.style.color = ''
    }
  }

  private removeHighlight(mark: HTMLElement): void {
    this.unwrap(mark)
    this.hideActions()
    this.syncButtonState(false)
  }

  private unwrap(mark: HTMLElement): void {
    unwrapInlineTag(mark)
  }

  private showActions(): void {
    if (!this.actions) {
      return
    }

    this.actions.hidden = false
    const mark = this.findCurrentMark()
    const style = mark
      ? this.currentStyle(mark)
      : { bgColor: null, textColor: null }

    for (const [color, button] of this.bgColorButtons.entries()) {
      button.dataset.state = color === style.bgColor ? 'active' : 'idle'
      button.setAttribute(
        'aria-pressed',
        color === style.bgColor ? 'true' : 'false',
      )
    }

    for (const [color, button] of this.textColorButtons.entries()) {
      button.dataset.state = color === style.textColor ? 'active' : 'idle'
      button.setAttribute(
        'aria-pressed',
        color === style.textColor ? 'true' : 'false',
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
