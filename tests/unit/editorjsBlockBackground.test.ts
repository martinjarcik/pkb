import { describe, expect, it } from 'vitest'
import type { EditorjsBlock } from '~/lib/editorjsMarkdown'
import {
  BLOCK_BACKGROUND_COLORS,
  normalizeSavedEditorjsBlocks,
  prepareEditorjsBlocksForEditor,
} from '~/lib/editorjsBlockBackground'

const [primaryColor, secondaryColor = primaryColor] = Object.keys(
  BLOCK_BACKGROUND_COLORS,
)

describe('editorjsBlockBackground', () => {
  it('adds tune data from background css classes before rendering', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box', `editor-background-${primaryColor}`],
      },
    ]

    expect(prepareEditorjsBlocksForEditor(blocks)).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box', `editor-background-${primaryColor}`],
        tunes: {
          backgroundColor: {
            color: primaryColor,
          },
        },
      },
    ])
  })

  it('moves saved background tune data back into css classes', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box'],
        tunes: {
          backgroundColor: {
            color: secondaryColor,
          },
        },
      },
    ]

    expect(normalizeSavedEditorjsBlocks(blocks)).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box', `editor-background-${secondaryColor}`],
      },
    ])
  })

  it('removes an existing background class when the saved tune is cleared', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: [`editor-background-${primaryColor}`, 'note-box'],
        tunes: {
          backgroundColor: {},
        },
      },
    ]

    expect(normalizeSavedEditorjsBlocks(blocks)).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box'],
      },
    ])
  })
})
