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

  function currentEditor(): EditorjsInstance | null {
    return editor.value
  }

  async function commitTitleChange(): Promise<void> {
    const instance = currentEditor()

    if (!instance || isApplyingExternalContent.value) {
      return
    }

    await instance.isReady
    const output = await instance.save()
    const blocks = normalizeSavedEditorjsBlocks(output.blocks)
    const titleText = extractNoteTitleText(blocks)

    if (titleText.length === 0 || titleText === title()) {
      return
    }

    await flushContentSync()
    emitTitleChange(titleText)
  }

  function findNoteTitleIndex(): number {
    const instance = currentEditor()

    if (!instance) {
      return -1
    }

    const blocksCount = instance.blocks.getBlocksCount()

    for (let index = 0; index < blocksCount; index += 1) {
      if (instance.blocks.getBlockByIndex(index)?.name === 'noteTitle') {
        return index
      }
    }

    return -1
  }

  function repairMovedNoteTitleBlock(): boolean {
    const instance = currentEditor()

    if (!instance) {
      return false
    }

    if (instance.blocks.getBlockByIndex(0)?.name === 'noteTitle') {
      return false
    }

    const noteTitleIndex = findNoteTitleIndex()

    if (noteTitleIndex <= 0) {
      return false
    }

    isRepairingTitleBlock.value = true

    try {
      instance.blocks.move(0, noteTitleIndex)
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
    const instance = currentEditor()

    if (isEditorBusy()) {
      return
    }

    if (!instance) {
      return
    }

    await instance.isReady

    if (isEditorBusy()) {
      return
    }

    if (repairMovedNoteTitleBlock()) {
      return
    }

    const output = await instance.save()

    if (isEditorBusy()) {
      return
    }

    const savedBlocks = normalizeSavedEditorjsBlocks(output.blocks)
    const normalizedBlocks = ensureNoteTitleBlock(savedBlocks, title())

    if (!blocksMatch(savedBlocks, normalizedBlocks)) {
      isRepairingTitleBlock.value = true

      try {
        await instance.blocks.render({
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
    commitTitleChange,
    handleEditorChange,
  }
}
