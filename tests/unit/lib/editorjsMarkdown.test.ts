import { describe, expect, it } from 'vitest'
import { editorjsBlocksToMarkdown } from '~/lib/blocksToMarkdown'
import { getEditorColors } from '~/lib/editorColors'
import { markdownToEditorjsBlocks } from '~/lib/markdownToBlocks'
import {
  getInlineHighlightDefaultColor,
  inlineHighlightMarkdownPrefix,
} from '~/lib/inlineHighlight'

const inlineHighlightColors = getEditorColors()
const inlineHighlightDefaultColor = getInlineHighlightDefaultColor()
const altColor =
  Object.keys(inlineHighlightColors).find(
    (color) => color !== inlineHighlightDefaultColor,
  ) ?? inlineHighlightDefaultColor

const defaultBg = inlineHighlightColors[inlineHighlightDefaultColor]!
const altMeta = inlineHighlightColors[altColor]!
const assetDisplayUrl = (path: string) => `asset://${path}`
const markdownAssetUrl = (fileUrl: string) => fileUrl.replace('asset://', '')

describe('editorjsMarkdown', () => {
  it('converts the first markdown H1 into a note title block', () => {
    const blocks = markdownToEditorjsBlocks('# Title\n\nHello world')

    expect(blocks).toEqual([
      {
        type: 'noteTitle',
        data: {
          text: 'Title',
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

  it('excludes note title blocks from markdown output', () => {
    const markdown = editorjsBlocksToMarkdown([
      {
        type: 'noteTitle',
        data: {
          text: 'Title',
        },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Hello world',
        },
      },
    ])

    expect(markdown).toBe('Hello world')
  })

  it('keeps later H1 blocks as regular headings', () => {
    const blocks = markdownToEditorjsBlocks('# Title\n\n# Section')

    expect(blocks).toEqual([
      {
        type: 'noteTitle',
        data: {
          text: 'Title',
        },
      },
      {
        type: 'paragraph',
        data: {
          text: '',
        },
      },
      {
        type: 'header',
        data: {
          text: 'Section',
          level: 1,
        },
      },
    ])
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

  it('inserts empty paragraph for a blank line before a list', () => {
    expect(markdownToEditorjsBlocks('Text\n\n- one\n- two')).toEqual([
      { type: 'paragraph', data: { text: 'Text' } },
      { type: 'paragraph', data: { text: '' } },
      {
        type: 'list',
        data: { items: ['one', 'two'], style: 'unordered' },
      },
    ])
  })

  it('inserts empty paragraph for a blank line after a list', () => {
    expect(markdownToEditorjsBlocks('- one\n- two\n\nMore')).toEqual([
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
        type: 'noteTitle',
        data: { text: 'Title' },
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

  it('round-trips a normal paragraph break', () => {
    const md = 'a\n\nb'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
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

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
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

  it('unwraps inline hashtag spans back to plain hashtag markdown on save', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: 'Use <span class="inline-hashtag">#engineering</span> here.',
          },
        },
      ]),
    ).toBe('Use #engineering here.')
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

  it('wraps plain hashtags in inline hashtag spans when loading markdown', () => {
    expect(markdownToEditorjsBlocks('Use #engineering here.')).toEqual([
      {
        type: 'paragraph',
        data: {
          text: 'Use <span class="inline-hashtag">#engineering</span> here.',
        },
      },
    ])
  })

  it('parses default highlight markdown to editor HTML with background only', () => {
    expect(markdownToEditorjsBlocks('Use ==important== text.')).toEqual([
      {
        type: 'paragraph',
        data: {
          text: `Use <mark class="inline-highlight" data-bg="${inlineHighlightDefaultColor}" style="background-color: ${defaultBg.background}">important</mark> text.`,
        },
      },
    ])
  })

  it('parses background-only colored highlight (double emoji) to editor HTML', () => {
    const prefix = inlineHighlightMarkdownPrefix({
      bgColor: altColor,
      textColor: null,
    })

    expect(markdownToEditorjsBlocks(`Use ==${prefix}urgent== text.`)).toEqual([
      {
        type: 'paragraph',
        data: {
          text: `Use <mark class="inline-highlight" data-bg="${altColor}" style="background-color: ${altMeta.background}">urgent</mark> text.`,
        },
      },
    ])
  })

  it('parses text-only colored highlight (single emoji) to editor HTML', () => {
    const prefix = inlineHighlightMarkdownPrefix({
      bgColor: null,
      textColor: altColor,
    })

    expect(markdownToEditorjsBlocks(`Use ==${prefix}urgent== text.`)).toEqual([
      {
        type: 'paragraph',
        data: {
          text: `Use <mark class="inline-highlight" data-text="${altColor}" style="color: ${altMeta.text}">urgent</mark> text.`,
        },
      },
    ])
  })

  it('parses combined bg+text highlight (three emojis) to editor HTML', () => {
    const bgColor = inlineHighlightDefaultColor
    const textColor = altColor
    const prefix = inlineHighlightMarkdownPrefix({
      bgColor,
      textColor,
    })

    expect(markdownToEditorjsBlocks(`Use ==${prefix}styled== text.`)).toEqual([
      {
        type: 'paragraph',
        data: {
          text: `Use <mark class="inline-highlight" data-bg="${bgColor}" data-text="${textColor}" style="background-color: ${defaultBg.background}; color: ${altMeta.text}">styled</mark> text.`,
        },
      },
    ])
  })

  it('parses asterisk bold emoji markdown to big emoji editor HTML', () => {
    expect(markdownToEditorjsBlocks('Status **🤖** updated.')).toEqual([
      {
        type: 'paragraph',
        data: {
          text: 'Status <strong class="inline-big-emoji">🤖</strong> updated.',
        },
      },
    ])
  })

  it('parses underscore bold emoji markdown to big emoji editor HTML', () => {
    expect(markdownToEditorjsBlocks('Status __🤖__ updated.')).toEqual([
      {
        type: 'paragraph',
        data: {
          text: 'Status <strong class="inline-big-emoji">🤖</strong> updated.',
        },
      },
    ])
  })

  it('keeps mixed bold emoji text as regular bold markup', () => {
    expect(markdownToEditorjsBlocks('Use **🤖 bot** label.')).toEqual([
      {
        type: 'paragraph',
        data: {
          text: 'Use <b>🤖 bot</b> label.',
        },
      },
    ])
  })

  it('serializes default highlight to markdown', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: `Use <mark class="inline-highlight" data-bg="${inlineHighlightDefaultColor}" style="background-color: ${defaultBg.background}">important</mark> text.`,
          },
        },
      ]),
    ).toBe('Use ==important== text.')
  })

  it('serializes background-only colored highlight to markdown', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: `Use <mark class="inline-highlight" data-bg="${altColor}" style="background-color: ${altMeta.background}">urgent</mark> text.`,
          },
        },
      ]),
    ).toBe(`Use ==${altMeta.emoji}${altMeta.emoji}urgent== text.`)
  })

  it('serializes text-only colored highlight to markdown', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: `Use <mark class="inline-highlight" data-text="${altColor}" style="color: ${altMeta.text}">urgent</mark> text.`,
          },
        },
      ]),
    ).toBe(`Use ==${altMeta.emoji}urgent== text.`)
  })

  it('serializes combined bg+text highlight to markdown', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: `Use <mark class="inline-highlight" data-bg="${inlineHighlightDefaultColor}" data-text="${altColor}" style="background-color: ${defaultBg.background}; color: ${altMeta.text}">styled</mark> text.`,
          },
        },
      ]),
    ).toBe(
      `Use ==${defaultBg.emoji}${defaultBg.emoji}${altMeta.emoji}styled== text.`,
    )
  })

  it('serializes legacy data-color attribute to markdown', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: `Use <mark class="inline-highlight" data-color="${altColor}" style="background-color: ${altMeta.background}">legacy</mark> text.`,
          },
        },
      ]),
    ).toBe(`Use ==${altMeta.emoji}${altMeta.emoji}legacy== text.`)
  })

  it('serializes big emoji html to asterisk bold markdown', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: 'Status <strong class="inline-big-emoji">🤖</strong> updated.',
          },
        },
      ]),
    ).toBe('Status **🤖** updated.')
  })

  it('removes big emoji caret anchors from markdown output', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: 'Status <strong class="inline-big-emoji">🤖</strong>\u200B updated.',
          },
        },
      ]),
    ).toBe('Status **🤖** updated.')
  })

  it('inserts separator between adjacent big emoji and bold in markdown output', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: 'Status <strong class="inline-big-emoji">🤖</strong><b>bold</b> updated.',
          },
        },
      ]),
    ).toBe('Status **🤖**\u200C**bold** updated.')
  })

  it('round-trips default highlight markdown', () => {
    const markdown = 'Use ==important== text.'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(markdown))).toBe(
      markdown,
    )
  })

  it('round-trips background-only colored highlight markdown', () => {
    const prefix = inlineHighlightMarkdownPrefix({
      bgColor: altColor,
      textColor: null,
    })
    const markdown = `Use ==${prefix}urgent== text.`

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(markdown))).toBe(
      markdown,
    )
  })

  it('round-trips text-only colored highlight markdown', () => {
    const prefix = inlineHighlightMarkdownPrefix({
      bgColor: null,
      textColor: altColor,
    })
    const markdown = `Use ==${prefix}urgent== text.`

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(markdown))).toBe(
      markdown,
    )
  })

  it('round-trips combined bg+text highlight markdown', () => {
    const prefix = inlineHighlightMarkdownPrefix({
      bgColor: inlineHighlightDefaultColor,
      textColor: altColor,
    })
    const markdown = `Use ==${prefix}styled== text.`

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(markdown))).toBe(
      markdown,
    )
  })

  it('round-trips asterisk bold emoji markdown as big emoji', () => {
    const markdown = 'Status **🤖** updated.'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(markdown))).toBe(
      markdown,
    )
  })

  it('normalizes underscore bold emoji to asterisk bold on round-trip', () => {
    expect(
      editorjsBlocksToMarkdown(
        markdownToEditorjsBlocks('Status __🤖__ updated.'),
      ),
    ).toBe('Status **🤖** updated.')
  })

  it('round-trips big emoji immediately followed by bold text', () => {
    const markdown = 'Status **🤖**\u200C**bold** updated.'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(markdown))).toBe(
      markdown,
    )
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

  it('parses block comment classes onto the following block', () => {
    const blocks = markdownToEditorjsBlocks(
      '<!-- block: highlight-box wide -->\nHello world',
    )

    expect(blocks).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Hello world' },
        cssClasses: ['highlight-box', 'wide'],
      },
    ])
  })

  it('parses block comment with extra whitespace between <!-- and block:', () => {
    const blocks = markdownToEditorjsBlocks(
      '<!--   block:   foo   bar   -->\nSome text',
    )

    expect(blocks).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Some text' },
        cssClasses: ['foo', 'bar'],
      },
    ])
  })

  it('attaches block comment classes to a heading block', () => {
    const blocks = markdownToEditorjsBlocks(
      '<!-- block: accent -->\n## Styled heading',
    )

    expect(blocks).toEqual([
      {
        type: 'header',
        data: { text: 'Styled heading', level: 2 },
        cssClasses: ['accent'],
      },
    ])
  })

  it('does not attach block comment to a preceding block', () => {
    const blocks = markdownToEditorjsBlocks(
      'Before\n\n<!-- block: test -->\nAfter',
    )

    const beforeBlock = blocks.find(
      (b) => b.type === 'paragraph' && b.data.text === 'Before',
    )
    const afterBlock = blocks.find(
      (b) => b.type === 'paragraph' && b.data.text === 'After',
    )

    expect(beforeBlock?.cssClasses).toBeUndefined()
    expect(afterBlock?.cssClasses).toEqual(['test'])
  })

  it('round-trips block comment classes through markdown', () => {
    const md = '<!-- block: highlight-box wide -->\nHello world'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
  })

  it('serializes cssClasses as a block comment in markdown output', () => {
    const markdown = editorjsBlocksToMarkdown([
      {
        type: 'paragraph',
        data: { text: 'Styled paragraph' },
        cssClasses: ['note-box', 'accent'],
      },
    ])

    expect(markdown).toBe('<!-- block: note-box accent -->\nStyled paragraph')
  })

  it('ignores regular HTML comments that do not start with block:', () => {
    const blocks = markdownToEditorjsBlocks('<!-- just a comment -->\nHello')

    expect(
      blocks.find((b) => b.data.text === 'Hello')?.cssClasses,
    ).toBeUndefined()
  })

  it('handles block comment with a single class', () => {
    const blocks = markdownToEditorjsBlocks('<!-- block: solo -->\nText')

    expect(blocks).toEqual([
      {
        type: 'paragraph',
        data: { text: 'Text' },
        cssClasses: ['solo'],
      },
    ])
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

  it('parses a standalone markdown image into an Editor.js image block', () => {
    const blocks = markdownToEditorjsBlocks(
      '![](assets/a.png)',
      assetDisplayUrl,
    )

    expect(blocks).toEqual([
      {
        type: 'image',
        data: {
          file: { url: 'asset://assets/a.png' },
          caption: '',
          withBorder: false,
          withBackground: false,
          stretched: false,
        },
      },
    ])
  })

  it('renders an Editor.js image block as markdown', () => {
    const md = editorjsBlocksToMarkdown(
      [
        {
          type: 'image',
          data: {
            file: { url: 'asset://assets/a.png' },
            caption: '',
            withBorder: false,
            withBackground: false,
            stretched: false,
          },
        },
      ],
      markdownAssetUrl,
    )

    expect(md).toBe('![](assets/a.png)')
  })

  it('round-trips markdown image caption and path', () => {
    const md = '![My caption](assets/b.jpg)'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
  })

  it('serializes image urls with a custom platform resolver', () => {
    const md = editorjsBlocksToMarkdown(
      markdownToEditorjsBlocks(
        '![](assets/photo.png)',
        (path) => `asset://${path}`,
      ),
      (fileUrl) => fileUrl.replace('asset://', ''),
    )

    expect(md).toBe('![](assets/photo.png)')
  })

  it('keeps a paragraph with inline image as a paragraph (image omitted from HTML)', () => {
    const blocks = markdownToEditorjsBlocks('Hello ![](assets/x.png)')

    expect(blocks).toEqual([
      {
        type: 'paragraph',
        data: {
          text: 'Hello ',
        },
      },
    ])
  })

  it('preserves external image URLs in markdown round-trip', () => {
    const md = '![](https://example.com/pic.png)'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
  })

  it('separates image block from preceding paragraph with a blank line', () => {
    const blocks = [
      { type: 'paragraph', data: { text: 'Hello world' } },
      {
        type: 'image',
        data: {
          file: { url: 'asset://assets/photo.png' },
          caption: '',
          withBorder: false,
          withBackground: false,
          stretched: false,
        },
      },
    ]

    const md = editorjsBlocksToMarkdown(blocks, markdownAssetUrl)
    expect(md).toBe('Hello world\n\n![](assets/photo.png)')

    const parsed = markdownToEditorjsBlocks(md, assetDisplayUrl)
    const imageBlock = parsed.find((b) => b.type === 'image')

    expect(imageBlock).toBeDefined()
    expect(imageBlock!.data.file).toEqual({
      url: 'asset://assets/photo.png',
    })
  })

  it('parses image-stretch block comment into a stretched image block', () => {
    const blocks = markdownToEditorjsBlocks(
      '<!-- block: image-stretch -->\n![](assets/wide.png)',
      assetDisplayUrl,
    )

    expect(blocks).toEqual([
      {
        type: 'image',
        data: {
          file: { url: 'asset://assets/wide.png' },
          caption: '',
          withBorder: false,
          withBackground: false,
          stretched: true,
        },
      },
    ])
  })

  it('emits image-stretch block comment for a stretched image block', () => {
    const md = editorjsBlocksToMarkdown(
      [
        {
          type: 'image',
          data: {
            file: { url: 'asset://assets/wide.png' },
            caption: '',
            withBorder: false,
            withBackground: false,
            stretched: true,
          },
        },
      ],
      markdownAssetUrl,
    )

    expect(md).toBe('<!-- block: image-stretch -->\n![](assets/wide.png)')
  })

  it('does not emit image-stretch comment for a non-stretched image', () => {
    const md = editorjsBlocksToMarkdown(
      [
        {
          type: 'image',
          data: {
            file: { url: 'asset://assets/a.png' },
            caption: '',
            withBorder: false,
            withBackground: false,
            stretched: false,
          },
        },
      ],
      markdownAssetUrl,
    )

    expect(md).toBe('![](assets/a.png)')
  })

  it('round-trips a stretched image through markdown', () => {
    const md = '<!-- block: image-stretch -->\n![](assets/wide.png)'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
  })

  it('merges image-stretch with other css classes on the block comment', () => {
    const blocks = markdownToEditorjsBlocks(
      '<!-- block: custom-frame image-stretch -->\n![](assets/wide.png)',
      assetDisplayUrl,
    )

    expect(blocks).toEqual([
      {
        type: 'image',
        data: {
          file: { url: 'asset://assets/wide.png' },
          caption: '',
          withBorder: false,
          withBackground: false,
          stretched: true,
        },
        cssClasses: ['custom-frame'],
      },
    ])
  })

  it('emits image-stretch alongside css classes for a stretched image', () => {
    const md = editorjsBlocksToMarkdown(
      [
        {
          type: 'image',
          data: {
            file: { url: 'asset://assets/wide.png' },
            caption: '',
            withBorder: false,
            withBackground: false,
            stretched: true,
          },
          cssClasses: ['custom-frame'],
        },
      ],
      markdownAssetUrl,
    )

    expect(md).toBe(
      '<!-- block: custom-frame image-stretch -->\n![](assets/wide.png)',
    )
  })

  it('serializes bold wrapping highlight to markdown preserving both', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: `Use <b><mark class="inline-highlight" data-bg="${inlineHighlightDefaultColor}" style="background-color: ${defaultBg.background}">important</mark></b> text.`,
          },
        },
      ]),
    ).toBe('Use **==important==** text.')
  })

  it('serializes italic wrapping highlight to markdown preserving both', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: `Use <i><mark class="inline-highlight" data-bg="${inlineHighlightDefaultColor}" style="background-color: ${defaultBg.background}">important</mark></i> text.`,
          },
        },
      ]),
    ).toBe('Use *==important==* text.')
  })

  it('serializes highlight wrapping bold to markdown preserving both', () => {
    expect(
      editorjsBlocksToMarkdown([
        {
          type: 'paragraph',
          data: {
            text: `Use <mark class="inline-highlight" data-bg="${inlineHighlightDefaultColor}" style="background-color: ${defaultBg.background}"><b>important</b></mark> text.`,
          },
        },
      ]),
    ).toBe('Use ==**important**== text.')
  })

  it('round-trips bold wrapping default highlight', () => {
    const md = 'Use **==important==** text.'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
  })

  it('round-trips italic wrapping default highlight', () => {
    const md = 'Use *==important==* text.'

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
  })

  it('round-trips bold wrapping colored highlight', () => {
    const prefix = inlineHighlightMarkdownPrefix({
      bgColor: altColor,
      textColor: null,
    })
    const md = `Use **==${prefix}important==** text.`

    expect(editorjsBlocksToMarkdown(markdownToEditorjsBlocks(md))).toBe(md)
  })
})
