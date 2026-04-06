import { beforeEach, describe, expect, it, vi } from 'vitest'
import BigEmojiTool from '~/lib/bigEmojiTool'
import {
  BIG_EMOJI_BIG_CLASS,
  BIG_EMOJI_BIG_MARKER,
  BIG_EMOJI_BIG_SIZE,
  BIG_EMOJI_CLASS,
} from '~/lib/bigEmoji'

type FakeClassList = {
  add: (...tokens: string[]) => void
  contains: (token: string) => boolean
}

type FakeElement = {
  tagName: string
  classList: FakeClassList
  dataset: Record<string, string | undefined>
  textContent: string
  contentEditable: string
  parentNode: {
    replaceChild: (next: FakeElement, previous: FakeElement) => void
  } | null
}

function createClassList(initialTokens: string[] = []): FakeClassList {
  const tokens = new Set(initialTokens)

  return {
    add: (...nextTokens: string[]) => {
      for (const token of nextTokens) {
        tokens.add(token)
      }
    },
    contains: (token: string) => tokens.has(token),
  }
}

function createFakeElement(
  tagName: string,
  {
    classNames = [],
    dataset = {},
    textContent = '',
  }: {
    classNames?: string[]
    dataset?: Record<string, string | undefined>
    textContent?: string
  } = {},
): FakeElement {
  return {
    tagName,
    classList: createClassList(classNames),
    dataset: { ...dataset },
    textContent,
    contentEditable: '',
    parentNode: null,
  }
}

describe('BigEmojiTool', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: (tagName: string) =>
        createFakeElement(tagName.toUpperCase()),
    })
  })

  it('removes the big marker when shrinking a stale big emoji to bigger', () => {
    const tool = Object.create(BigEmojiTool.prototype) as BigEmojiTool
    const original = createFakeElement('B', {
      classNames: [BIG_EMOJI_CLASS],
      textContent: `🤖${BIG_EMOJI_BIG_MARKER}`,
    })
    const replacements: FakeElement[] = []

    original.parentNode = {
      replaceChild: (next) => {
        replacements.push(next)
      },
    }
    ;(
      tool as unknown as {
        setBigEmojiSize: (element: HTMLElement, size: 'bigger' | 'big') => void
      }
    ).setBigEmojiSize(original as unknown as HTMLElement, 'bigger')
    const replacement = replacements[0]
    if (!replacement) {
      throw new Error('expected replacement element')
    }

    expect({
      textContent: replacement.textContent,
      isBigClass: replacement.classList.contains(BIG_EMOJI_BIG_CLASS),
      size: replacement.dataset.size,
    }).toEqual({
      textContent: '🤖',
      isBigClass: false,
      size: undefined,
    })
  })

  it('normalizes a big emoji to the canonical big markup', () => {
    const tool = Object.create(BigEmojiTool.prototype) as BigEmojiTool
    const original = createFakeElement('STRONG', {
      classNames: [BIG_EMOJI_CLASS],
      textContent: '🤖',
    })
    const replacements: FakeElement[] = []

    original.parentNode = {
      replaceChild: (next) => {
        replacements.push(next)
      },
    }
    ;(
      tool as unknown as {
        setBigEmojiSize: (element: HTMLElement, size: 'bigger' | 'big') => void
      }
    ).setBigEmojiSize(original as unknown as HTMLElement, 'big')
    const replacement = replacements[0]
    if (!replacement) {
      throw new Error('expected replacement element')
    }

    expect({
      tagName: replacement.tagName,
      textContent: replacement.textContent,
      isBigClass: replacement.classList.contains(BIG_EMOJI_BIG_CLASS),
      size: replacement.dataset.size,
    }).toEqual({
      tagName: 'B',
      textContent: `🤖${BIG_EMOJI_BIG_MARKER}`,
      isBigClass: true,
      size: BIG_EMOJI_BIG_SIZE,
    })
  })
})
