import { unwrapInlineTag } from './editorjsInlineToolUtils'

type InlineTagName = 'B' | 'I'

type PatchExecCommandArgs = {
  highlightCssClass: string
  onChange: () => void
}

let originalExecCommand: typeof document.execCommand | null = null

export function findAncestorHighlightMark(
  node: Node | null,
  highlightCssClass: string,
): HTMLElement | null {
  if (!node) {
    return null
  }

  const element = node instanceof HTMLElement ? node : node.parentElement

  return element?.closest<HTMLElement>(`mark.${highlightCssClass}`) ?? null
}

export function selectionIsInsideHighlight(
  highlightCssClass: string,
): HTMLElement | null {
  const selection = window.getSelection()

  if (!selection || selection.rangeCount === 0) {
    return null
  }

  const range = selection.getRangeAt(0)
  const startMark = findAncestorHighlightMark(
    range.startContainer,
    highlightCssClass,
  )
  const endMark = findAncestorHighlightMark(
    range.endContainer,
    highlightCssClass,
  )

  if (!startMark || startMark !== endMark) {
    return null
  }

  return startMark
}

export function toggleInlineTagInsideHighlight(
  highlightCssClass: string,
  tagName: InlineTagName,
): void {
  const selection = window.getSelection()

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return
  }

  const range = selection.getRangeAt(0)
  const parentTag =
    range.commonAncestorContainer instanceof HTMLElement
      ? range.commonAncestorContainer.closest(tagName)
      : range.commonAncestorContainer.parentElement?.closest(tagName)

  if (
    parentTag instanceof HTMLElement &&
    findAncestorHighlightMark(parentTag, highlightCssClass)
  ) {
    unwrapInlineTag(parentTag)
    return
  }

  const wrapper = document.createElement(tagName)

  wrapper.appendChild(range.extractContents())
  range.insertNode(wrapper)
  selection.removeAllRanges()

  const restored = document.createRange()

  restored.selectNodeContents(wrapper)
  selection.addRange(restored)
}

export function patchExecCommandForInlineHighlight({
  highlightCssClass,
  onChange,
}: PatchExecCommandArgs): void {
  if (originalExecCommand) {
    return
  }

  originalExecCommand = document.execCommand.bind(document)
  document.execCommand = (
    command: string,
    showUI?: boolean,
    value?: string,
  ): boolean => {
    const lowerCommand = command.toLowerCase()

    if (
      (lowerCommand === 'bold' || lowerCommand === 'italic') &&
      selectionIsInsideHighlight(highlightCssClass)
    ) {
      toggleInlineTagInsideHighlight(
        highlightCssClass,
        lowerCommand === 'bold' ? 'B' : 'I',
      )
      onChange()
      return true
    }

    return originalExecCommand!(command, showUI, value)
  }
}

export function restoreExecCommand(): void {
  if (!originalExecCommand) {
    return
  }

  document.execCommand = originalExecCommand
  originalExecCommand = null
}
