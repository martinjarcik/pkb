import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  editorjsBlocksToMarkdown,
  markdownToEditorjsBlocks,
  resolveEditorjsMarkdownModule,
} from '~/composables/useEditorjsMarkdown'

describe('editorjsMarkdown', () => {
  beforeEach(() => {
    vi.stubGlobal('window', globalThis)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('converts markdown headings and paragraphs to Editor.js blocks', async () => {
    const blocks = await markdownToEditorjsBlocks('# Title\n\nHello world')

    expect(blocks).toEqual([
      {
        type: 'header',
        data: {
          text: 'Title',
          level: 1,
        },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Hello world',
        },
      },
    ])
  })

  it('converts Editor.js blocks back to markdown', async () => {
    const markdown = await editorjsBlocksToMarkdown([
      {
        type: 'header',
        data: {
          text: 'Title',
          level: 1,
        },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Hello world',
        },
      },
    ])

    expect(markdown).toBe('# Title\n\nHello world')
  })

  it('returns no blocks for empty markdown', async () => {
    await expect(markdownToEditorjsBlocks('')).resolves.toEqual([])
  })

  it('returns empty markdown for empty blocks', async () => {
    await expect(editorjsBlocksToMarkdown([])).resolves.toBe('')
  })

  it('resolves the markdown converter from a plain module namespace', () => {
    const converter = {
      MDtoBlocks: vi.fn(),
      MDfromBlocks: vi.fn(),
    }

    expect(resolveEditorjsMarkdownModule(converter)).toBe(converter)
  })

  it('resolves the markdown converter from nested default exports', () => {
    const converter = {
      MDtoBlocks: vi.fn(),
      MDfromBlocks: vi.fn(),
    }

    expect(
      resolveEditorjsMarkdownModule({
        default: {
          default: converter,
        },
      }),
    ).toBe(converter)
  })
})
