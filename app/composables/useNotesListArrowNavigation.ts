import { nextTick, type Ref } from 'vue'
import { adjacentNoteListId } from '~/notes/adjacentNoteListId'

type UseNotesListArrowNavigationArgs = {
  orderedIds: Ref<readonly string[]>
  selectedNoteId: Ref<string | null>
  selectNote: (id: string) => Promise<void>
  scrollItemIdIntoView: (id: string) => void
}

function isArrowKeyNavigationTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return false
  }

  if (target.isContentEditable) {
    return false
  }

  return true
}

/** ArrowUp/ArrowDown to move note selection inside the notes list viewport. */
export function useNotesListArrowNavigation({
  orderedIds,
  selectedNoteId,
  selectNote,
  scrollItemIdIntoView,
}: UseNotesListArrowNavigationArgs) {
  function onNotesListKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }

    if (event.altKey || event.metaKey || event.ctrlKey) {
      return
    }

    if (!isArrowKeyNavigationTarget(event.target)) {
      return
    }

    const ids = orderedIds.value

    if (ids.length === 0) {
      return
    }

    const direction = event.key === 'ArrowDown' ? 'next' : 'previous'
    const nextId = adjacentNoteListId(ids, selectedNoteId.value, direction)

    if (nextId === null) {
      return
    }

    event.preventDefault()
    void (async () => {
      await selectNote(nextId)
      await nextTick()
      scrollItemIdIntoView(nextId)
    })()
  }

  return {
    onNotesListKeydown,
  }
}
