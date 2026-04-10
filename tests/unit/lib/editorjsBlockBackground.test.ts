import { describe, expect, it } from 'vitest'
import type { EditorjsBlock } from '~/lib/editorjsMarkdownTypes'
import {
  getBlockBackgroundColors,
  normalizeSavedEditorjsBlocks,
  prepareEditorjsBlocksForEditor,
} from '~/lib/editorjsBlockBackground'
import EditorjsBlockBackgroundTune from '~/lib/editorjsBlockBackgroundTune'

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

  it('hydrates missing tune data from the rendered block class', () => {
    const classTokens = new Set([
      'note-box',
      `block-background-${primaryColor}`,
    ])
    const styleProperties: Record<string, string> = {}
    const element = {
      classList: {
        add: (...tokens: string[]) => {
          for (const token of tokens) classTokens.add(token)
        },
        [Symbol.iterator]: () => classTokens[Symbol.iterator](),
      },
      dataset: {},
      style: {
        removeProperty: (name: string) => {
          delete styleProperties[name]
        },
        setProperty: (name: string, value: string) => {
          styleProperties[name] = value
        },
      },
    } as unknown as HTMLElement
    const tune = new EditorjsBlockBackgroundTune({
      api: {},
      block: {
        dispatchChange: () => {},
      },
      data: {},
    } as never)

    tune.wrap(element)

    expect(tune.save()).toEqual({ color: primaryColor })
    expect(classTokens.has('ce-block-background')).toBe(true)
    expect(element.dataset.blockBackgroundColor).toBe(primaryColor)
    expect(styleProperties['--editor-block-background-color']).toBe(
      getBlockBackgroundColors()[primaryColor]!.background,
    )
    expect(styleProperties['--editor-block-text-color']).toBe(
      getBlockBackgroundColors()[primaryColor]!.text,
    )
  })
})
