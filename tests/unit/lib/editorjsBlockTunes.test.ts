import { describe, expect, it } from 'vitest'
import {
  normalizeSavedEditorjsBlocks,
  prepareEditorjsBlocksForEditor,
} from '~/lib/editorjsBlockTunes'
import { BIG_EMOJI_STICK_BLOCK_CLASS } from '~/lib/bigEmoji'
import type { EditorjsBlock } from '~/lib/editorjsMarkdownTypes'

describe('editorjsBlockTunes', () => {
  it('decorates the first big emoji with stick metadata for stick blocks', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: {
          text: 'Status <b class="inline-big-emoji inline-big-emoji-big" contenteditable="false" data-size="big">🤖\u2060</b> updated.',
        },
        cssClasses: [BIG_EMOJI_STICK_BLOCK_CLASS],
      },
    ]

    expect(prepareEditorjsBlocksForEditor(blocks)).toEqual([
      {
        type: 'paragraph',
        data: {
          text: 'Status <b class="inline-big-emoji inline-big-emoji-big inline-big-emoji-stick" contenteditable="false" data-size="big" data-stick="true">🤖\u2060</b> updated.',
        },
        cssClasses: [BIG_EMOJI_STICK_BLOCK_CLASS],
      },
    ])
  })

  it('adds the stick block class when saved html contains stick metadata', () => {
    const blocks: EditorjsBlock[] = [
      {
        type: 'paragraph',
        data: {
          text: 'Status <b class="inline-big-emoji inline-big-emoji-big inline-big-emoji-stick" contenteditable="false" data-size="big" data-stick="true">🤖\u2060</b> updated.',
        },
      },
    ]

    expect(normalizeSavedEditorjsBlocks(blocks)).toEqual([
      {
        type: 'paragraph',
        data: {
          text: 'Status <b class="inline-big-emoji inline-big-emoji-big inline-big-emoji-stick" contenteditable="false" data-size="big" data-stick="true">🤖\u2060</b> updated.',
        },
        cssClasses: [BIG_EMOJI_STICK_BLOCK_CLASS],
      },
    ])
  })
})
