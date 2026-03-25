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

  it('converts inline html inside table cells back to markdown syntax', () => {
    const markdown = editorjsBlocksToMarkdown([
      {
        type: 'table',
        data: {
          alignments: ['left', 'left'],
          content: [
            ['Token', 'Role'],
            [
              '<code class="inline-code">Klong Test</code>',
              '<i>Search fixture</i> with <a href="https://example.com/fixtures/sn-02">link</a>',
            ],
          ],
          stretched: false,
          withHeadings: true,
        },
      },
    ])

    expect(markdown).toBe(`| Token | Role |
| :--- | :--- |
| \`Klong Test\` | *Search fixture* with [link](https://example.com/fixtures/sn-02) |`)
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

  it('round-trips GFM task list markdown with blank line after', () => {
    const md = '- [ ] a\n- [x] b\n\nNext'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
  })

  it('adds a blank line after a list block when serializing', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'list',
          data: {
            style: 'checklist',
            meta: {},
            items: [{ content: 'a', meta: { checked: false }, items: [] }],
          },
        },
        {
          type: 'paragraph',
          data: { text: 'Next' },
        },
      ]),
    ).toBe('- [ ] a\n\nNext')
  })

  it('adds a blank line before a list block when serializing', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: { text: 'Before' },
        },
        {
          type: 'list',
          data: { items: ['one', 'two'], style: 'unordered' },
        },
      ]),
    ).toBe('Before\n\n- one\n- two')
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

  it('translates inline html markup to markdown on save', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: '<i>Secondary seeds:</i> <a href="https://example.com/fixtures/sn-02">SN-02 index</a>',
          },
        },
        {
          type: 'paragraph',
          data: {
            text: 'Use <code class="inline-code">fixture</code> with <b>bold</b> text.',
          },
        },
      ]),
    ).toBe(
      '*Secondary seeds:* [SN-02 index](https://example.com/fixtures/sn-02)\nUse `fixture` with **bold** text.',
    )
  })

  it('translates inline html markup from markdown input into editor formatting', () => {
    expect(
      markdownToEditorjsBlocks(
        '<i>Secondary seeds:</i> <a href="https://example.com/fixtures/sn-02">SN-02 index</a>\nUse <code class="inline-code">fixture</code> with <b>bold</b> text.',
      ),
    ).toEqual([
      {
        type: 'paragraph',
        data: {
          text: '<i>Secondary seeds:</i> <a href="https://example.com/fixtures/sn-02">SN-02 index</a>',
        },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Use <code class="inline-code">fixture</code> with <b>bold</b> text.',
        },
      },
    ])
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

  it('round-trips headings interleaved with checklists (with blank lines)', () => {
    const md =
      '## Section A\n\n- [ ] task 1\n- [x] task 2\n\n## Section B\n\n- [ ] task 3\n- [ ] task 4\n\n## Section C\n\n- [x] task 5\n- [ ] task 6'

    const blocks = markdownToEditorjsBlocks(md)
    expect(editorjsBlocksToMarkdown(blocks)).toBe(md)
  })

  it('keeps headings interleaved with checklists compact on save', () => {
    const input =
      '## Section A\n- [ ] task 1\n- [x] task 2\n## Section B\n- [ ] task 3\n- [ ] task 4\n## Section C\n- [x] task 5\n- [ ] task 6'

    const blocks = markdownToEditorjsBlocks(input)
    expect(editorjsBlocksToMarkdown(blocks)).toBe(input)
  })

  it('parses headings between checklists without blank lines', () => {
    const md = '## Section A\n- [ ] task 1\n## Section B\n- [ ] task 2'

    expect(markdownToEditorjsBlocks(md)).toEqual([
      { type: 'header', data: { text: 'Section A', level: 2 } },
      {
        type: 'list',
        data: {
          style: 'checklist',
          meta: {},
          items: [{ content: 'task 1', meta: { checked: false }, items: [] }],
        },
      },
      { type: 'header', data: { text: 'Section B', level: 2 } },
      {
        type: 'list',
        data: {
          style: 'checklist',
          meta: {},
          items: [{ content: 'task 2', meta: { checked: false }, items: [] }],
        },
      },
    ])
  })

  it('does not add a blank line between a checklist and the following heading', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'list',
          data: {
            style: 'checklist',
            meta: {},
            items: [{ content: 'task 1', meta: { checked: false }, items: [] }],
          },
        },
        {
          type: 'header',
          data: { text: 'Section B', level: 2 },
        },
      ]),
    ).toBe('- [ ] task 1\n## Section B')
  })
})
