import { describe, expect, it } from 'vitest'
import type { EditorjsBlock } from '~/lib/editorjsMarkdownTypes'
import {
  normalizeSavedEditorjsBlocksWithSizes,
  prepareEditorjsBlocksWithSizesForEditor,
} from '~/lib/editorjsBlockSize'

describe('editorjsBlockSize', () => {
  it('adds tune data from size css classes before rendering', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box', 'block-size-bigger'],
      },
    ]

    expect(prepareEditorjsBlocksWithSizesForEditor(blocks)).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box', 'block-size-bigger'],
        tunes: {
          blockSize: {
            size: 'bigger',
          },
        },
      },
    ])
  })

  it('moves saved size tune data back into css classes', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box'],
        tunes: {
          blockSize: {
            size: 'big',
          },
        },
      },
    ]

    expect(normalizeSavedEditorjsBlocksWithSizes(blocks)).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box', 'block-size-big'],
      },
    ])
  })

  it('removes an existing size class when the saved tune is cleared', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['block-size-big', 'note-box'],
        tunes: {
          blockSize: {},
        },
      },
    ]

    expect(normalizeSavedEditorjsBlocksWithSizes(blocks)).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['note-box'],
      },
    ])
  })

  it('does not add size tune data to heading blocks before rendering', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'header',
        data: { text: 'Heading', level: 2 },
        cssClasses: ['note-box', 'block-size-bigger'],
      },
    ]

    expect(prepareEditorjsBlocksWithSizesForEditor(blocks)).toEqual(blocks)
  })

  it('removes saved size data from heading blocks', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'header',
        data: { text: 'Heading', level: 2 },
        cssClasses: ['note-box', 'block-size-big'],
        tunes: {
          blockSize: {
            size: 'big',
          },
        },
      },
    ]

    expect(normalizeSavedEditorjsBlocksWithSizes(blocks)).toEqual([
      {
        type: 'header',
        data: { text: 'Heading', level: 2 },
        cssClasses: ['note-box'],
      },
    ])
  })
})
