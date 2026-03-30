import { describe, expect, it } from 'vitest'
import type { EditorjsBlock } from '~/lib/editorjsMarkdown'
import {
  normalizeSavedEditorjsBlocks,
  prepareEditorjsBlocksForEditor,
} from '~/lib/editorjsBlockBackground'

describe('editorjsBlockBackground', () => {
  it('adds tune data from background css classes before rendering', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box', 'editor-background-blue'],
      },
    ]

    expect(prepareEditorjsBlocksForEditor(blocks)).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box', 'editor-background-blue'],
        tunes: {
          backgroundColor: {
            color: 'blue',
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
            color: 'green',
          },
        },
      },
    ]

    expect(normalizeSavedEditorjsBlocks(blocks)).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box', 'editor-background-green'],
      },
    ])
  })

  it('removes an existing background class when the saved tune is cleared', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['editor-background-red', 'note-box'],
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
