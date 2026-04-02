import { ref, type Ref } from 'vue'
import {
  blocksMatch,
  ensureNoteTitleBlock,
  extractNoteTitleText,
} from '~/lib/editorjsTitleBlock'
import {
  normalizeSavedEditorjsBlocks,
  prepareEditorjsBlocksForEditor,
} from '~/lib/editorjsBlockBackground'
import type { EditorjsBlock } from '~/lib/editorjsMarkdownTypes'

type EditorjsInstance = {
  blocks: {
    getBlockByIndex(index: number): { name: string } | undefined
    getBlocksCount(): number
    move(toIndex: number, fromIndex?: number): void
    render(data: { blocks: EditorjsBlock[] }): Promise<void>
  }
  isReady: Promise<void>
  save(): Promise<{ blocks: EditorjsBlock[] }>
}

type UseEditorTitleRepairArgs = {
  editor: Ref<EditorjsInstance | null>
  isApplyingExternalContent: Ref<boolean>
  title: () => string
  flushContentSync: () => Promise<void>
  scheduleContentSync: () => void
  emitTitleChange: (value: string) => void
}

export function useEditorTitleRepair({
  editor,
  isApplyingExternalContent,
  title,
  flushContentSync,
  scheduleContentSync,
  emitTitleChange,
}: UseEditorTitleRepairArgs) {
  const isRepairingTitleBlock = ref(false)

  async function commitTitleChange(): Promise<void> {
    if (!editor.value || isApplyingExternalContent.value) {
      return
    }

    await editor.value.isReady
    const output = await editor.value.save()
    const blocks = normalizeSavedEditorjsBlocks(output.blocks)
    const titleText = extractNoteTitleText(blocks)

    if (titleText.length === 0 || titleText === title()) {
      return
    }

    await flushContentSync()
    emitTitleChange(titleText)
  }

  function findNoteTitleIndex(): number {
    if (!editor.value) {
      return -1
    }

    const blocksCount = editor.value.blocks.getBlocksCount()

    for (let index = 0; index < blocksCount; index += 1) {
      if (editor.value.blocks.getBlockByIndex(index)?.name === 'noteTitle') {
        return index
      }
    }

    return -1
  }

  function repairMovedNoteTitleBlock(): boolean {
    if (!editor.value) {
      return false
    }

    if (editor.value.blocks.getBlockByIndex(0)?.name === 'noteTitle') {
      return false
    }

    const noteTitleIndex = findNoteTitleIndex()

    if (noteTitleIndex <= 0) {
      return false
    }

    isRepairingTitleBlock.value = true

    try {
      editor.value.blocks.move(0, noteTitleIndex)
    } finally {
      window.requestAnimationFrame(() => {
        isRepairingTitleBlock.value = false
      })
    }

    return true
  }

  function isEditorBusy(): boolean {
    return (
      !editor.value ||
      isApplyingExternalContent.value ||
      isRepairingTitleBlock.value
    )
  }

  async function handleEditorChange(): Promise<void> {
    if (isEditorBusy()) {
      return
    }

    await editor.value!.isReady

    if (isEditorBusy()) {
      return
    }

    if (repairMovedNoteTitleBlock()) {
      return
    }

    const output = await editor.value!.save()

    if (isEditorBusy()) {
      return
    }

    const savedBlocks = normalizeSavedEditorjsBlocks(output.blocks)
    const normalizedBlocks = ensureNoteTitleBlock(savedBlocks, title())

    if (!blocksMatch(savedBlocks, normalizedBlocks)) {
      isRepairingTitleBlock.value = true

      try {
        await editor.value!.blocks.render({
          blocks: prepareEditorjsBlocksForEditor(normalizedBlocks),
        })
      } finally {
        isRepairingTitleBlock.value = false
      }

      return
    }

    scheduleContentSync()
  }

  return {
    isRepairingTitleBlock,
    commitTitleChange,
    handleEditorChange,
  }
}
