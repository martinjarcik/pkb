import { describe, expect, it } from 'vitest'
import type { EditorjsBlock } from '~/lib/editorjsMarkdownTypes'
import {
  getBlockBackgroundColors,
  normalizeSavedEditorjsBlocks,
  prepareEditorjsBlocksForEditor,
} from '~/lib/editorjsBlockBackground'

const [primaryColor, secondaryColor = primaryColor] = Object.keys(
  getBlockBackgroundColors(),
)

describe('editorjsBlockBackground', () => {
  it('adds tune data from background css classes before rendering', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box', `block-background-${primaryColor}`],
      },
    ]

    expect(prepareEditorjsBlocksForEditor(blocks)).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box', `block-background-${primaryColor}`],
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
        cssClasses: ['note-box', `block-background-${secondaryColor}`],
      },
    ])
  })

  it('removes an existing background class when the saved tune is cleared', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: [`block-background-${primaryColor}`, 'note-box'],
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
