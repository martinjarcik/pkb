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
          text: '',
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

    expect(markdown).toBe('# Title\nHello world')
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

  it('converts markdown blockquotes to simple quote blocks', () => {
    const blocks = markdownToEditorjsBlocks('> Quoted text')

    expect(blocks).toEqual([
      {
        type: 'simpleQuote',
        data: {
          text: 'Quoted text',
        },
      },
    ])
  })

  it('converts simple quote blocks back to markdown blockquotes', () => {
    const markdown = editorjsBlocksToMarkdown([
      {
        type: 'simpleQuote',
        data: {
          text: 'Quoted text',
        },
      },
    ])

    expect(markdown).toBe('> Quoted text')
  })

  it('converts markdown GFM task lists to checklist blocks', () => {
    const blocks = markdownToEditorjsBlocks('- [ ] open\n- [x] done')

    expect(blocks).toEqual([
      {
        type: 'list',
        data: {
          style: 'checklist',
          meta: {},
          items: [
            { content: 'open', meta: { checked: false }, items: [] },
            { content: 'done', meta: { checked: true }, items: [] },
          ],
        },
      },
    ])
  })

  it('converts checklist blocks back to GFM task list markdown', () => {
    const markdown = editorjsBlocksToMarkdown([
      {
        type: 'list',
        data: {
          style: 'checklist',
          meta: {},
          items: [
            { content: 'open', meta: { checked: false }, items: [] },
            { content: 'done', meta: { checked: true }, items: [] },
          ],
        },
      },
    ])

    expect(markdown).toBe('- [ ] open\n- [x] done')
  })

  it('round-trips GFM task list markdown', () => {
    const md = '- [ ] a\n- [x] b\n\nNext'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
  })

  it('inserts empty paragraph for a blank line before and after a list', () => {
    const before = markdownToEditorjsBlocks('Text\n\n- one\n- two')
    expect(before).toEqual([
      { type: 'paragraph', data: { text: 'Text' } },
      { type: 'paragraph', data: { text: '' } },
      {
        type: 'list',
        data: { items: ['one', 'two'], style: 'unordered' },
      },
    ])

    const after = markdownToEditorjsBlocks('- one\n- two\n\nMore')
    expect(after).toEqual([
      {
        type: 'list',
        data: { items: ['one', 'two'], style: 'unordered' },
      },
      { type: 'paragraph', data: { text: '' } },
      { type: 'paragraph', data: { text: 'More' } },
    ])
  })

  it('round-trips blank lines around a list', () => {
    const md = 'Text\n\n- item\n\nAfter'
    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
  })

  it('converts list markers with extra leading spaces to list blocks', () => {
    expect(markdownToEditorjsBlocks('    * tags view')).toEqual([
      {
        type: 'list',
        data: {
          items: ['tags view'],
          style: 'unordered',
        },
      },
    ])

    expect(markdownToEditorjsBlocks('    - tags view')).toEqual([
      {
        type: 'list',
        data: {
          items: ['tags view'],
          style: 'unordered',
        },
      },
    ])
  })

  it('does not change indented list-like lines inside fenced code blocks', () => {
    const blocks = markdownToEditorjsBlocks('```\n    * not a list\n```')

    expect(blocks).toEqual([
      {
        type: 'code',
        data: {
          code: '    * not a list',
        },
      },
    ])
  })

  it('inserts empty paragraph for a single blank line between paragraphs', () => {
    expect(markdownToEditorjsBlocks('a\n\nb')).toEqual([
      { type: 'paragraph', data: { text: 'a' } },
      { type: 'paragraph', data: { text: '' } },
      { type: 'paragraph', data: { text: 'b' } },
    ])
  })

  it('inserts empty paragraph blocks when extra blank lines sit between paragraphs', () => {
    const blocks = markdownToEditorjsBlocks('a\n\n\nb')

    expect(blocks).toEqual([
      {
        type: 'paragraph',
        data: { text: 'a' },
      },
      {
        type: 'paragraph',
        data: { text: '' },
      },
      {
        type: 'paragraph',
        data: { text: '' },
      },
      {
        type: 'paragraph',
        data: { text: 'b' },
      },
    ])
  })

  it('inserts empty paragraph blocks for leading blank lines', () => {
    const blocks = markdownToEditorjsBlocks('\n\n# Title')

    expect(blocks).toEqual([
      { type: 'paragraph', data: { text: '' } },
      { type: 'paragraph', data: { text: '' } },
      {
        type: 'header',
        data: { text: 'Title', level: 1 },
      },
    ])
  })

  it('inserts empty paragraph blocks for trailing blank lines', () => {
    const blocks = markdownToEditorjsBlocks('a\n\n')

    expect(blocks).toEqual([
      { type: 'paragraph', data: { text: 'a' } },
      { type: 'paragraph', data: { text: '' } },
    ])
  })

  it('converts newline-only markdown to empty paragraphs', () => {
    expect(markdownToEditorjsBlocks('\n')).toEqual([
      { type: 'paragraph', data: { text: '' } },
    ])
    expect(markdownToEditorjsBlocks('\n\n')).toEqual([
      { type: 'paragraph', data: { text: '' } },
      { type: 'paragraph', data: { text: '' } },
    ])
  })

  it('round-trips two blank lines between paragraphs', () => {
    const md = 'a\n\n\n\nb'
    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
  })

  it('preserves three newlines between paragraphs', () => {
    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks('a\n\n\nb'))).toBe(
      'a\n\n\nb',
    )
  })

  it('round-trips a normal paragraph break as an empty paragraph block', () => {
    const md = 'a\n\nb'
    const blocks = markdownToEditorjsBlocks(md)
    expect(editorjsBlocksToMarkdown(blocks)).toBe(md)
    expect(blocks).toEqual([
      { type: 'paragraph', data: { text: 'a' } },
      { type: 'paragraph', data: { text: '' } },
      { type: 'paragraph', data: { text: 'b' } },
    ])
  })

  it('converts a single newline into separate paragraph blocks', () => {
    expect(markdownToEditorjsBlocks('Hello\nWorld')).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello' },
      },
      {
        type: 'paragraph',
        data: { text: 'World' },
      },
    ])
  })

  it('round-trips single-newline paragraph separation', () => {
    const md = 'Hello\nWorld'
    const blocks = markdownToEditorjsBlocks(md)
    expect(editorjsBlocksToMarkdown(blocks)).toBe(md)
    expect(markdownToEditorjsBlocks(md)).toEqual(blocks)
  })

  it('treats attributed br tags as paragraph separators', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: 'Hello<br rtrvr-ls="12~ow,13~lc" rtrvr-ro="42">World',
          },
        },
      ]),
    ).toBe('Hello\nWorld')

    expect(
      markdownToEditorjsBlocks(
        'Hello<br rtrvr-ls="12~ow,13~lc" rtrvr-ro="42">World',
      ),
    ).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello' },
      },
      {
        type: 'paragraph',
        data: { text: 'World' },
      },
    ])
  })

  it('ignores the editor trailing empty paragraph when saving markdown', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: { text: 'Hello world' },
        },
        {
          type: 'paragraph',
          data: { text: '' },
        },
      ]),
    ).toBe('Hello world')
  })

  it('returns no blocks for empty markdown', () => {
    expect(markdownToEditorjsBlocks('')).toEqual([])
  })

  it('returns empty markdown for empty blocks', () => {
    expect(editorjsBlocksToMarkdown([])).toBe('')
  })
})
