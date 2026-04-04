type EditorjsBlocksApiForDragDrop = {
  getBlocksCount(): number
  move(toIndex: number, fromIndex: number): void
}

type EditorjsDragDropHandle = {
  destroy(): void
}

const DROP_ABOVE_CLASS = 'ce-block--drop-above'
const DROP_BELOW_CLASS = 'ce-block--drop-below'
const DRAGGING_CLASS = 'ce-block--dragging'
const DRAG_THRESHOLD = 5

function getBlockIndex(block: Element): number {
  const parent = block.parentElement
  if (!parent) return -1
  return Array.from(parent.children).indexOf(block)
}

function getAllBlocks(holder: HTMLElement): HTMLElement[] {
  return Array.from(holder.querySelectorAll<HTMLElement>('.ce-block'))
}

function findCurrentBlock(holder: HTMLElement): HTMLElement | null {
  const toolbar = document.querySelector('.ce-toolbar')
  if (!toolbar) return null

  const toolbarRect = toolbar.getBoundingClientRect()
  const toolbarMidY = toolbarRect.top + toolbarRect.height / 2
  const allBlocks = holder.querySelectorAll<HTMLElement>('.ce-block')

  let closest: HTMLElement | null = null
  let closestDist = Infinity

  for (const block of allBlocks) {
    const rect = block.getBoundingClientRect()
    if (toolbarMidY >= rect.top && toolbarMidY <= rect.bottom) {
      return block
    }
    const dist = Math.min(
      Math.abs(rect.top - toolbarMidY),
      Math.abs(rect.bottom - toolbarMidY),
    )
    if (dist < closestDist) {
      closestDist = dist
      closest = block
    }
  }

  return closest
}

function findBlockAtY(
  allBlocks: HTMLElement[],
  clientY: number,
): { block: HTMLElement; index: number } | null {
  for (let i = 0; i < allBlocks.length; i++) {
    const rect = allBlocks[i]!.getBoundingClientRect()
    if (clientY >= rect.top && clientY <= rect.bottom) {
      return { block: allBlocks[i]!, index: i }
    }
  }
  return null
}

export function initEditorjsDragDrop(
  holder: HTMLElement,
  blocks: EditorjsBlocksApiForDragDrop,
): EditorjsDragDropHandle {
  let dragFromIndex: number | null = null
  let currentDropTarget: HTMLElement | null = null
  let isDragging = false
  let startX = 0
  let startY = 0
  let abortController: AbortController | null = null

  function clearDropIndicator(): void {
    if (!currentDropTarget) return
    currentDropTarget.classList.remove(DROP_ABOVE_CLASS, DROP_BELOW_CLASS)
    currentDropTarget = null
  }

  function setToolbarVisible(visible: boolean): void {
    const toolbar = document.querySelector<HTMLElement>('.ce-toolbar')
    if (toolbar) {
      toolbar.style.display = visible ? '' : 'none'
    }
  }

  function clearAllDragState(): void {
    clearDropIndicator()
    holder
      .querySelectorAll(`.${DRAGGING_CLASS}`)
      .forEach((el) => el.classList.remove(DRAGGING_CLASS))
    setToolbarVisible(true)
    dragFromIndex = null
    isDragging = false
    abortController?.abort()
    abortController = null
  }

  function updateDropTarget(clientY: number): void {
    if (dragFromIndex === null) return

    const allBlocks = getAllBlocks(holder)
    const hit = findBlockAtY(allBlocks, clientY)

    if (!hit) {
      clearDropIndicator()
      return
    }

    if (currentDropTarget !== hit.block) {
      clearDropIndicator()
    }

    currentDropTarget = hit.block
    hit.block.classList.remove(DROP_ABOVE_CLASS, DROP_BELOW_CLASS)

    if (hit.index === dragFromIndex) return

    const rect = hit.block.getBoundingClientRect()
    const midY = rect.top + rect.height / 2

    if (clientY < midY) {
      hit.block.classList.add(DROP_ABOVE_CLASS)
    } else {
      hit.block.classList.add(DROP_BELOW_CLASS)
    }
  }

  function dropAtPosition(clientY: number): void {
    if (dragFromIndex === null) return

    const allBlocks = getAllBlocks(holder)
    const hit = findBlockAtY(allBlocks, clientY)

    if (!hit || blocks.getBlocksCount() <= 1) return

    const rect = hit.block.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    let dropIndex = hit.index

    if (clientY >= midY) {
      dropIndex += 1
    }

    if (dropIndex > dragFromIndex) {
      dropIndex -= 1
    }

    if (dropIndex !== dragFromIndex) {
      blocks.move(dropIndex, dragFromIndex)
    }
  }

  let passingThrough = false

  function onDocumentMouseDown(event: MouseEvent): void {
    if (passingThrough) return

    const target = event.target
    if (!(target instanceof Element)) return

    const btn = target.closest('.ce-toolbar__settings-btn')
    if (!btn) return

    const block = findCurrentBlock(holder)
    if (!block) return

    event.preventDefault()
    event.stopImmediatePropagation()

    startX = event.clientX
    startY = event.clientY
    const blockIndex = getBlockIndex(block)

    abortController = new AbortController()
    const signal = abortController.signal

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY

      if (!isDragging && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) {
        return
      }

      if (!isDragging) {
        isDragging = true
        dragFromIndex = blockIndex
        block.classList.add(DRAGGING_CLASS)
        setToolbarVisible(false)
      }

      moveEvent.preventDefault()
      updateDropTarget(moveEvent.clientY)
    }

    const onMouseUp = (upEvent: MouseEvent) => {
      const wasDragging = isDragging
      if (wasDragging) {
        upEvent.preventDefault()
        upEvent.stopImmediatePropagation()
        dropAtPosition(upEvent.clientY)
      }
      clearAllDragState()

      if (!wasDragging) {
        passingThrough = true
        btn.dispatchEvent(
          new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
        )
        btn.dispatchEvent(
          new MouseEvent('mouseup', { bubbles: true, cancelable: true }),
        )
        btn.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true }),
        )
        passingThrough = false
      }
    }

    document.addEventListener('mousemove', onMouseMove, { signal })
    document.addEventListener('mouseup', onMouseUp, { signal })
  }

  document.addEventListener('mousedown', onDocumentMouseDown, true)

  return {
    destroy() {
      clearAllDragState()
      document.removeEventListener('mousedown', onDocumentMouseDown, true)
    },
  }
}
