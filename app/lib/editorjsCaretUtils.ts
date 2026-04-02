export function caretTextOffsetWithin(container: HTMLElement): number | null {
  const selection = window.getSelection()

  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    return null
  }

  const range = selection.getRangeAt(0).cloneRange()

  if (!container.contains(range.endContainer)) {
    return null
  }

  range.setStart(container, 0)

  return range.toString().length
}

export function setCaretTextOffset(
  container: HTMLElement,
  offset: number,
): void {
  const selection = window.getSelection()

  if (!selection) {
    return
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let traversed = 0
  let currentNode = walker.nextNode()

  while (currentNode) {
    const textNode = currentNode as Text
    const nextTraversed = traversed + textNode.data.length

    if (offset <= nextTraversed) {
      const range = document.createRange()
      const nodeOffset = Math.max(0, offset - traversed)

      range.setStart(textNode, nodeOffset)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      return
    }

    traversed = nextTraversed
    currentNode = walker.nextNode()
  }

  const range = document.createRange()

  range.selectNodeContents(container)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}
