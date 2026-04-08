import { describe, expect, it } from 'vitest'
import { noteDescriptionFromContent } from '~/notes/noteDescriptionFromContent'

describe('noteDescriptionFromContent', () => {
  it('strips markdown heading lines', () => {
    const result = noteDescriptionFromContent(
      '# Heading one\n\n## Heading two\n\nBody paragraph.',
    )

    expect(result).toBe('Body paragraph.')
  })

  it('truncates to 120 characters with ellipsis', () => {
    const result = noteDescriptionFromContent(`# Heading\n\n${'a'.repeat(121)}`)

    expect(result).toBe(`${'a'.repeat(117)}...`)
  })

  it('strips markdown formatting symbols', () => {
    const result = noteDescriptionFromContent(
      [
        '# Heading',
        '',
        '- [x] **Bold** item with `code` and [link](https://example.com)',
        '> Quoted _text_ and ~~strikethrough~~.',
      ].join('\n'),
    )

    expect(result).toBe(
      'Bold item with code and link Quoted text and strikethrough.',
    )
  })

  it('strips highlight markdown formatting symbols', () => {
    const result = noteDescriptionFromContent(
      'Use ==highlighted== and ==🔴urgent== text.',
    )

    expect(result).toBe('Use highlighted and urgent text.')
  })

  it('strips highlight with double and triple emoji prefixes', () => {
    const result = noteDescriptionFromContent(
      'Use ==🟢🟢bg== and ==🟢🟢🟣both== text.',
    )

    expect(result).toBe('Use bg and both text.')
  })

  it('strips standalone emoji characters from description', () => {
    const result = noteDescriptionFromContent('Travel 🚀 plans for 2026.')

    expect(result).toBe('Travel plans for 2026.')
  })

  it('omits raw urls from description text', () => {
    const result = noteDescriptionFromContent(
      'Read this https://example.com/docs next.',
    )

    expect(result).toBe('Read this next.')
  })

  it('keeps markdown link labels while omitting the url text', () => {
    const result = noteDescriptionFromContent(
      'Open [the docs](https://example.com/docs) for details.',
    )

    expect(result).toBe('Open the docs for details.')
  })

  it('omits markdown table separator rows', () => {
    const result = noteDescriptionFromContent(
      ['| Name | Value |', '| --- | --- |', '| Width | 120px |'].join('\n'),
    )

    expect(result).toBe('Name Value Width 120px')
  })

  it('returns empty string for heading-only content', () => {
    expect(noteDescriptionFromContent('# Just a heading')).toBe('')
  })

  it('returns empty string for empty content', () => {
    expect(noteDescriptionFromContent('')).toBe('')
  })

  it('skips fenced code blocks', () => {
    const result = noteDescriptionFromContent(
      '```\ncode inside\n```\n\nVisible text.',
    )

    expect(result).toBe('Visible text.')
  })
})
