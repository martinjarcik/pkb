import { describe, expect, it } from 'vitest'
import {
  editorjsBlocksToMarkdown,
  markdownToEditorjsBlocks,
} from '~/composables/useEditorjsMarkdown'

describe('editorjsMarkdown', () => {
  it('converts markdown headings and paragraphs to Editor.js blocks', () => {
    const blocks = markdownToEditorjsBlocks('# Title\n\nHello world')

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

  it('converts Editor.js blocks back to markdown', () => {
    const markdown = editorjsBlocksToMarkdown([
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

  it('converts markdown tables to Editor.js table blocks', () => {
    const blocks = markdownToEditorjsBlocks(`| Name | Score | City |
| :--- | :---: | ---: |
| Ada | 10 | Prague |
| Linus | 9 | Helsinki |`)

    expect(blocks).toEqual([
      {
        type: 'table',
        data: {
          alignments: ['left', 'center', 'right'],
          content: [
            ['Name', 'Score', 'City'],
            ['Ada', '10', 'Prague'],
            ['Linus', '9', 'Helsinki'],
          ],
          stretched: false,
          withHeadings: true,
        },
      },
    ])
  })

  it('converts Editor.js table blocks back to markdown', () => {
    const markdown = editorjsBlocksToMarkdown([
      {
        type: 'table',
        data: {
          alignments: ['left', 'center', 'right'],
          content: [
            ['Name', 'Score', 'City'],
            ['Ada', '10', 'Prague'],
            ['Linus', '9', 'Helsinki'],
          ],
          stretched: false,
          withHeadings: true,
        },
      },
    ])

    expect(markdown).toBe(`| Name | Score | City |
| :--- | :---: | ---: |
| Ada | 10 | Prague |
| Linus | 9 | Helsinki |`)
  })

  it('returns no blocks for empty markdown', () => {
    expect(markdownToEditorjsBlocks('')).toEqual([])
  })

  it('returns empty markdown for empty blocks', () => {
    expect(editorjsBlocksToMarkdown([])).toBe('')
  })
})
