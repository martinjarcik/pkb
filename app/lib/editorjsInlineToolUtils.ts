export function unwrapInlineTag(parentTag: HTMLElement): void {
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
