import { EDITOR_COLORS } from './editorColors'
import type { EditorjsBlock } from './editorjsMarkdownTypes'

export const BLOCK_BACKGROUND_COLORS = EDITOR_COLORS
export const BLOCK_BACKGROUND_TUNE_NAME = 'backgroundColor'
export const BLOCK_BACKGROUND_CLASS_PREFIX = 'editor-background-'

export type BlockBackgroundColor = keyof typeof BLOCK_BACKGROUND_COLORS

function isBlockBackgroundClass(value: string): boolean {
  return value.startsWith(BLOCK_BACKGROUND_CLASS_PREFIX)
}

function blockBackgroundCssClass(color: BlockBackgroundColor): string {
  return `${BLOCK_BACKGROUND_CLASS_PREFIX}${color}`
}

export function isBlockBackgroundColor(
  value: string | undefined,
): value is BlockBackgroundColor {
  return Boolean(value && value in BLOCK_BACKGROUND_COLORS)
}

export function extractBlockBackgroundColorFromCssClasses(
  cssClasses: string[] | undefined,
): BlockBackgroundColor | null {
  for (const className of cssClasses ?? []) {
    if (!isBlockBackgroundClass(className)) {
      continue
    }

    const color = className.slice(BLOCK_BACKGROUND_CLASS_PREFIX.length)

    if (isBlockBackgroundColor(color)) {
      return color
    }
  }

  return null
}

export function extractBlockBackgroundColorFromTunes(
  tunes: Record<string, unknown> | undefined,
): BlockBackgroundColor | null {
  const tune = tunes?.[BLOCK_BACKGROUND_TUNE_NAME]

  if (typeof tune !== 'object' || tune === null) {
    return null
  }

  const color = (tune as { color?: unknown }).color

  if (typeof color === 'string' && isBlockBackgroundColor(color)) {
    return color
  }

  return null
}

function mergeBlockBackgroundCssClasses(
  cssClasses: string[] | undefined,
  color: BlockBackgroundColor | null,
): string[] | undefined {
  const nextClasses = (cssClasses ?? []).filter(
    (className) => !isBlockBackgroundClass(className),
  )

  if (color) {
    nextClasses.push(blockBackgroundCssClass(color))
  }

  return nextClasses.length > 0 ? nextClasses : undefined
}

export function prepareEditorjsBlocksForEditor(
  blocks: EditorjsBlock[],
): EditorjsBlock[] {
  return blocks.map((block) => {
    const color = extractBlockBackgroundColorFromCssClasses(block.cssClasses)

    if (!color) {
      return block
    }

    return {
      ...block,
      tunes: {
        ...(block.tunes ?? {}),
        [BLOCK_BACKGROUND_TUNE_NAME]: {
          color,
        },
      },
    }
  })
}

export function normalizeSavedEditorjsBlocks(
  blocks: EditorjsBlock[],
): EditorjsBlock[] {
  return blocks.map((block) => {
    const hasBackgroundTune = Boolean(
      block.tunes &&
      Object.prototype.hasOwnProperty.call(
        block.tunes,
        BLOCK_BACKGROUND_TUNE_NAME,
      ),
    )
    const color = hasBackgroundTune
      ? extractBlockBackgroundColorFromTunes(block.tunes)
      : extractBlockBackgroundColorFromCssClasses(block.cssClasses)
    const cssClasses = mergeBlockBackgroundCssClasses(block.cssClasses, color)
    const {
      tunes: _blockTunes,
      cssClasses: _blockCssClasses,
      ...baseBlock
    } = block
    const { [BLOCK_BACKGROUND_TUNE_NAME]: _removed, ...nextTunes } =
      block.tunes ?? {}

    return {
      ...baseBlock,
      ...(cssClasses ? { cssClasses } : {}),
      ...(Object.keys(nextTunes).length > 0 ? { tunes: nextTunes } : {}),
    }
  })
}
