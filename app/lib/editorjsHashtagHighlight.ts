import { caretTextOffsetWithin, setCaretTextOffset } from './editorjsCaretUtils'

function createHashtagFragment(
  text: string,
  hashtagCssClass: string,
): DocumentFragment | null {
  const matches = [...text.matchAll(/(^|\s)(#[^\s#]+)/gu)]

  if (matches.length === 0) {
    return null
  }

  const fragment = document.createDocumentFragment()
  let lastIndex = 0

  for (const match of matches) {
    const leading = match[1] ?? ''
    const tag = match[2] ?? ''
    const matchIndex = match.index ?? 0
    const tagStart = matchIndex + leading.length

    fragment.append(text.slice(lastIndex, tagStart))

    const hashtag = document.createElement('span')

    hashtag.className = hashtagCssClass
    hashtag.textContent = tag
    fragment.append(hashtag)
    lastIndex = tagStart + tag.length
  }

  fragment.append(text.slice(lastIndex))

  return fragment
}

export function highlightHashtagsInEditable(
  editable: HTMLElement,
  hashtagCssClass: string,
): void {
  const caretOffset = caretTextOffsetWithin(editable)
  const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parentElement = node.parentElement

      if (
        parentElement?.closest(
          `.${hashtagCssClass}, code, a, [data-note-title]`,
        )
      ) {
        return NodeFilter.FILTER_REJECT
      }

      return NodeFilter.FILTER_ACCEPT
    },
  })
  const textNodes: Text[] = []

  let currentNode = walker.nextNode()

  while (currentNode) {
    textNodes.push(currentNode as Text)
    currentNode = walker.nextNode()
  }

  let didReplace = false

  for (const textNode of textNodes) {
    const fragment = createHashtagFragment(textNode.data, hashtagCssClass)

    if (!fragment) {
      continue
    }

    textNode.parentNode?.replaceChild(fragment, textNode)
    didReplace = true
  }

  if (didReplace && caretOffset !== null) {
    setCaretTextOffset(editable, caretOffset)
  }
}

export function resolveEditableTarget(
  target: EventTarget | null,
  holder: HTMLElement | null,
): HTMLElement | null {
  if (!(target instanceof Node)) {
    return null
  }

  const element =
    target instanceof HTMLElement ? target : (target.parentElement ?? null)
  const editable = element?.closest<HTMLElement>('[contenteditable="true"]')

  if (
    !editable ||
    !holder?.contains(editable) ||
    editable.matches('[data-note-title]')
  ) {
    return null
  }

  return editable
}

export function handleHashtagCompletionKeyup(args: {
  event: KeyboardEvent
  holder: HTMLElement | null
  hashtagCssClass: string
  completionPattern: RegExp
}): void {
  const { event, holder, hashtagCssClass, completionPattern } = args

  if (event.key !== ' ' && event.code !== 'Space') {
    return
  }

  const editable = resolveEditableTarget(event.target, holder)

  if (!editable || !completionPattern.test(editable.textContent ?? '')) {
    return
  }

  highlightHashtagsInEditable(editable, hashtagCssClass)
}
