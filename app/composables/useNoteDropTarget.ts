import { ref } from 'vue'

export function useNoteDropTarget(
  onDropNote: (noteId: string) => Promise<void>,
) {
  const dragDepth = ref(0)
  const isDropActive = ref(false)

  function handleDragEnter(): void {
    dragDepth.value += 1
    isDropActive.value = true
  }

  function handleDragLeave(): void {
    dragDepth.value = Math.max(0, dragDepth.value - 1)

    if (dragDepth.value === 0) {
      isDropActive.value = false
    }
  }

  function handleDragOver(event: DragEvent): void {
    event.preventDefault()

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  async function handleDrop(event: DragEvent): Promise<void> {
    event.preventDefault()
    dragDepth.value = 0
    isDropActive.value = false

    const noteId = event.dataTransfer?.getData('text/plain').trim()

    if (!noteId) {
      return
    }

    await onDropNote(noteId)
  }

  return {
    isDropActive,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  }
}
