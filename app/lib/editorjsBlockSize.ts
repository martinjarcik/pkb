import type { EditorjsBlock } from './editorjsMarkdownTypes'

export const BLOCK_SIZE_TUNE_NAME = 'blockSize'
export const BLOCK_SIZE_CLASS_PREFIX = 'block-size-'

export type BlockSize = 'bigger' | 'big'

function supportsBlockSize(block: EditorjsBlock): boolean {
  return block.type !== 'header'
}

export function isBlockSize(value: string | undefined): value is BlockSize {
  return value === 'bigger' || value === 'big'
}

function isBlockSizeClass(value: string): boolean {
  return value.startsWith(BLOCK_SIZE_CLASS_PREFIX)
}

function blockSizeCssClass(size: BlockSize): string {
  return `${BLOCK_SIZE_CLASS_PREFIX}${size}`
}

export function extractBlockSizeFromCssClasses(
  cssClasses: string[] | undefined,
): BlockSize | null {
  for (const className of cssClasses ?? []) {
    if (!isBlockSizeClass(className)) {
      continue
    }

    const size = className.slice(BLOCK_SIZE_CLASS_PREFIX.length)

    if (isBlockSize(size)) {
      return size
    }
  }

  return null
}

export function extractBlockSizeFromTunes(
  tunes: Record<string, unknown> | undefined,
): BlockSize | null {
  const tune = tunes?.[BLOCK_SIZE_TUNE_NAME]

  if (typeof tune !== 'object' || tune === null) {
    return null
  }

  const size = (tune as { size?: unknown }).size

  if (typeof size === 'string' && isBlockSize(size)) {
    return size
  }

  return null
}

function mergeBlockSizeCssClasses(
  cssClasses: string[] | undefined,
  size: BlockSize | null,
): string[] | undefined {
  const nextClasses = (cssClasses ?? []).filter(
    (className) => !isBlockSizeClass(className),
  )

  if (size) {
    nextClasses.push(blockSizeCssClass(size))
  }

  return nextClasses.length > 0 ? nextClasses : undefined
}

export function prepareEditorjsBlocksWithSizesForEditor(
  blocks: EditorjsBlock[],
): EditorjsBlock[] {
  return blocks.map((block) => {
    if (!supportsBlockSize(block)) {
      return block
    }

    const size = extractBlockSizeFromCssClasses(block.cssClasses)

    if (!size) {
      return block
    }

    return {
      ...block,
      tunes: {
        ...(block.tunes ?? {}),
        [BLOCK_SIZE_TUNE_NAME]: {
          size,
        },
      },
    }
  })
}

export function normalizeSavedEditorjsBlocksWithSizes(
  blocks: EditorjsBlock[],
): EditorjsBlock[] {
  return blocks.map((block) => {
    if (!supportsBlockSize(block)) {
      const cssClasses = mergeBlockSizeCssClasses(block.cssClasses, null)
      const {
        tunes: _blockTunes,
        cssClasses: _blockCssClasses,
        ...baseBlock
      } = block
      const { [BLOCK_SIZE_TUNE_NAME]: _removed, ...nextTunes } =
        block.tunes ?? {}

      return {
        ...baseBlock,
        ...(cssClasses ? { cssClasses } : {}),
        ...(Object.keys(nextTunes).length > 0 ? { tunes: nextTunes } : {}),
      }
    }

    const hasSizeTune = Boolean(
      block.tunes &&
      Object.prototype.hasOwnProperty.call(block.tunes, BLOCK_SIZE_TUNE_NAME),
    )
    const size = hasSizeTune
      ? extractBlockSizeFromTunes(block.tunes)
      : extractBlockSizeFromCssClasses(block.cssClasses)
    const cssClasses = mergeBlockSizeCssClasses(block.cssClasses, size)
    const {
      tunes: _blockTunes,
      cssClasses: _blockCssClasses,
      ...baseBlock
    } = block
    const { [BLOCK_SIZE_TUNE_NAME]: _removed, ...nextTunes } = block.tunes ?? {}

    return {
      ...baseBlock,
      ...(cssClasses ? { cssClasses } : {}),
      ...(Object.keys(nextTunes).length > 0 ? { tunes: nextTunes } : {}),
    }
  })
}
