import { describe, expect, it } from 'vitest'
import {
  blocksMatch,
  createNoteTitleBlock,
  ensureNoteTitleBlock,
  extractNoteTitleText,
  isNoteTitleBlock,
  renderNoteTitleBlocks,
} from '~/lib/editorjsTitleBlock'

describe('editorjsTitleBlock', () => {
  describe('createNoteTitleBlock', () => {
    it('creates a noteTitle block with the given text', () => {
      expect(createNoteTitleBlock('My Note')).toEqual({
        type: 'noteTitle',
        data: { text: 'My Note' },
      })
    })
  })

  describe('isNoteTitleBlock', () => {
    it('returns true for noteTitle blocks', () => {
      expect(
        isNoteTitleBlock({ type: 'noteTitle', data: { text: 'Title' } }),
      ).toBe(true)
    })

    it('returns false for other block types', () => {
      expect(
        isNoteTitleBlock({ type: 'paragraph', data: { text: 'Hello' } }),
      ).toBe(false)
    })
  })

  describe('ensureNoteTitleBlock', () => {
    it('keeps existing title block at index 0', () => {
      const blocks = [
        { type: 'noteTitle', data: { text: 'Existing' } },
        { type: 'paragraph', data: { text: 'Content' } },
      ]

      expect(ensureNoteTitleBlock(blocks, 'Fallback')).toEqual([
        { type: 'noteTitle', data: { text: 'Existing' } },
        { type: 'paragraph', data: { text: 'Content' } },
      ])
    })

    it('moves a misplaced title block to index 0', () => {
      const blocks = [
        { type: 'paragraph', data: { text: 'Content' } },
        { type: 'noteTitle', data: { text: 'Moved' } },
      ]

      expect(ensureNoteTitleBlock(blocks, 'Fallback')).toEqual([
        { type: 'noteTitle', data: { text: 'Moved' } },
        { type: 'paragraph', data: { text: 'Content' } },
      ])
    })

    it('creates a title block with fallback when missing', () => {
      const blocks = [{ type: 'paragraph', data: { text: 'Content' } }]

      expect(ensureNoteTitleBlock(blocks, 'Fallback')).toEqual([
        { type: 'noteTitle', data: { text: 'Fallback' } },
        { type: 'paragraph', data: { text: 'Content' } },
      ])
    })

    it('creates a title block for empty blocks', () => {
      expect(ensureNoteTitleBlock([], 'Fallback')).toEqual([
        { type: 'noteTitle', data: { text: 'Fallback' } },
      ])
    })
  })

  describe('renderNoteTitleBlocks', () => {
    it('replaces any existing title block with the given title', () => {
      const blocks = [
        { type: 'noteTitle', data: { text: 'Old' } },
        { type: 'paragraph', data: { text: 'Content' } },
      ]

      expect(renderNoteTitleBlocks(blocks, 'New')).toEqual([
        { type: 'noteTitle', data: { text: 'New' } },
        { type: 'paragraph', data: { text: 'Content' } },
      ])
    })

    it('prepends a title block to blocks without one', () => {
      const blocks = [{ type: 'paragraph', data: { text: 'Content' } }]

      expect(renderNoteTitleBlocks(blocks, 'Title')).toEqual([
        { type: 'noteTitle', data: { text: 'Title' } },
        { type: 'paragraph', data: { text: 'Content' } },
      ])
    })
  })

  describe('extractNoteTitleText', () => {
    it('extracts plain text from a title block', () => {
      const blocks = [{ type: 'noteTitle', data: { text: 'My Title' } }]

      expect(extractNoteTitleText(blocks)).toBe('My Title')
    })

    it('strips HTML tags from the title text', () => {
      const blocks = [
        { type: 'noteTitle', data: { text: '<b>Bold</b> title' } },
      ]

      expect(extractNoteTitleText(blocks)).toBe('Bold title')
    })

    it('returns empty string when no title block exists', () => {
      const blocks = [{ type: 'paragraph', data: { text: 'Content' } }]

      expect(extractNoteTitleText(blocks)).toBe('')
    })

    it('trims whitespace from the extracted text', () => {
      const blocks = [{ type: 'noteTitle', data: { text: '  Spaced  ' } }]

      expect(extractNoteTitleText(blocks)).toBe('Spaced')
    })
  })

  describe('blocksMatch', () => {
    it('returns true for identical block arrays', () => {
      const blocks = [{ type: 'paragraph', data: { text: 'Hello' } }]

      expect(blocksMatch(blocks, [...blocks])).toBe(true)
    })

    it('returns false for different block arrays', () => {
      const a = [{ type: 'paragraph', data: { text: 'Hello' } }]
      const b = [{ type: 'paragraph', data: { text: 'World' } }]

      expect(blocksMatch(a, b)).toBe(false)
    })

    it('returns true for empty arrays', () => {
      expect(blocksMatch([], [])).toBe(true)
    })
  })
})
