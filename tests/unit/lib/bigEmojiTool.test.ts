import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BigEmojiTool from '~/lib/bigEmojiTool'
import {
  BIG_EMOJI_BIGGER_CLASS,
  BIG_EMOJI_BIGGER_SIZE,
  BIG_EMOJI_DEFAULT_SIZE,
  BIG_EMOJI_BIG_CLASS,
  BIG_EMOJI_BIG_MARKER,
  BIG_EMOJI_BIG_SIZE,
  BIG_EMOJI_CLASS,
  BIG_EMOJI_SELECTED_BLOCK_CLASS,
  BIG_EMOJI_STICK_BLOCK_CLASS,
  BIG_EMOJI_STICK_CLASS,
} from '~/lib/bigEmoji'

type FakeClassList = {
  add: (...tokens: string[]) => void
  contains: (token: string) => boolean
  remove: (...tokens: string[]) => void
  toggle: (token: string, force?: boolean) => boolean
}

type FakeElement = {
  tagName: string
  className?: string
  classList: FakeClassList
  dataset: Record<string, string | undefined>
  textContent: string
  contentEditable: string
  hidden?: boolean
  style?: Record<string, string>
  children?: FakeElement[]
  parentNode: {
    replaceChild: (next: FakeElement, previous: FakeElement) => void
  } | null
  append?: (...children: FakeElement[]) => void
  remove?: () => void
  addEventListener?: (event: string, handler: EventListener) => void
  setAttribute?: (name: string, value: string) => void
  querySelector?: (selector: string) => FakeElement | null
}

type FakeFragment = {
  children: Array<FakeElement | string>
  append: (...children: Array<FakeElement | string>) => void
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
    remove: (...nextTokens: string[]) => {
      for (const token of nextTokens) {
        tokens.delete(token)
      }
    },
    toggle: (token: string, force?: boolean) => {
      const nextValue = force ?? !tokens.has(token)

      if (nextValue) {
        tokens.add(token)
        return true
      }

      tokens.delete(token)
      return false
    },
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
    className: '',
    classList: createClassList(classNames),
    dataset: { ...dataset },
    textContent,
    contentEditable: '',
    hidden: false,
    style: {},
    children: [],
    parentNode: null,
    append(...children: FakeElement[]) {
      this.children?.push(...children)
    },
    remove() {},
    addEventListener() {},
    setAttribute() {},
    querySelector() {
      return null
    },
  }
}

describe('BigEmojiTool', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: (tagName: string) =>
        createFakeElement(tagName.toUpperCase()),
    })
    vi.stubGlobal('HTMLElement', Object)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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
        replacements.push(next as FakeElement)
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
      isBiggerClass: replacement.classList.contains(BIG_EMOJI_BIGGER_CLASS),
      isBigClass: replacement.classList.contains(BIG_EMOJI_BIG_CLASS),
      size: replacement.dataset.size,
    }).toEqual({
      textContent: '🤖',
      isBiggerClass: true,
      isBigClass: false,
      size: BIG_EMOJI_BIGGER_SIZE,
    })
  })

  it('normalizes an emoji to the canonical default emoji block markup', () => {
    const tool = Object.create(BigEmojiTool.prototype) as BigEmojiTool
    const original = createFakeElement('B', {
      classNames: [BIG_EMOJI_CLASS, BIG_EMOJI_BIGGER_CLASS],
      dataset: { size: BIG_EMOJI_BIGGER_SIZE },
      textContent: '🤖',
    })
    const replacements: FakeElement[] = []

    original.parentNode = {
      replaceChild: (next) => {
        replacements.push(next as FakeElement)
      },
    }
    ;(
      tool as unknown as {
        setBigEmojiSize: (
          element: HTMLElement,
          size: 'default' | 'bigger' | 'big',
        ) => void
      }
    ).setBigEmojiSize(original as unknown as HTMLElement, 'default')
    const replacement = replacements[0]
    if (!replacement) {
      throw new Error('expected replacement element')
    }

    expect({
      textContent: replacement.textContent,
      isBiggerClass: replacement.classList.contains(BIG_EMOJI_BIGGER_CLASS),
      isBigClass: replacement.classList.contains(BIG_EMOJI_BIG_CLASS),
      size: replacement.dataset.size,
    }).toEqual({
      textContent: '🤖',
      isBiggerClass: false,
      isBigClass: false,
      size: BIG_EMOJI_DEFAULT_SIZE,
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
        replacements.push(next as FakeElement)
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

  it('does not infer stick mode from another block state', () => {
    const tool = Object.create(BigEmojiTool.prototype) as BigEmojiTool
    const plainBigEmoji = createFakeElement('B', {
      classNames: [BIG_EMOJI_CLASS, BIG_EMOJI_BIG_CLASS],
      dataset: { size: BIG_EMOJI_BIG_SIZE },
      textContent: `🤖${BIG_EMOJI_BIG_MARKER}`,
    })
    const stickBigEmoji = createFakeElement('B', {
      classNames: [BIG_EMOJI_CLASS, BIG_EMOJI_BIG_CLASS, BIG_EMOJI_STICK_CLASS],
      dataset: { size: BIG_EMOJI_BIG_SIZE, stick: 'true' },
      textContent: `🙂${BIG_EMOJI_BIG_MARKER}`,
    })
    const block = createFakeElement('DIV', {
      classNames: [BIG_EMOJI_STICK_BLOCK_CLASS],
    })

    expect(
      (
        tool as unknown as {
          isStickMode: (
            element: HTMLElement,
            block: Element | null | undefined,
          ) => boolean
        }
      ).isStickMode(
        plainBigEmoji as unknown as HTMLElement,
        block as unknown as Element,
      ),
    ).toBe(false)

    expect(
      (
        tool as unknown as {
          isStickMode: (
            element: HTMLElement,
            block: Element | null | undefined,
          ) => boolean
        }
      ).isStickMode(
        stickBigEmoji as unknown as HTMLElement,
        block as unknown as Element,
      ),
    ).toBe(true)
  })

  it('reuses one floating actions container across tool instances', () => {
    const appended: FakeElement[] = []
    const fakeDocument = {
      body: {
        append: (element: FakeElement) => {
          appended.push(element)
        },
      },
      createElement: (tagName: string) =>
        createFakeElement(tagName.toUpperCase()),
      addEventListener(_event: string, _handler: EventListener) {},
      removeEventListener() {},
    }
    const fakeWindow = {
      addEventListener() {},
      removeEventListener() {},
    }

    vi.stubGlobal('document', fakeDocument)
    vi.stubGlobal('window', fakeWindow)

    const first = new BigEmojiTool({ api: {} as never })
    const second = new BigEmojiTool({ api: {} as never })

    ;(
      first as unknown as { ensureFloatingActions: () => void }
    ).ensureFloatingActions()
    ;(
      second as unknown as { ensureFloatingActions: () => void }
    ).ensureFloatingActions()

    expect(appended).toHaveLength(1)
    expect(appended[0]?.children?.map((child) => child.className)).toEqual([
      'big-emoji-action big-emoji-action-default',
      'big-emoji-action big-emoji-action-bigger',
      'big-emoji-action big-emoji-action-big',
      'big-emoji-action big-emoji-action-stick',
    ])

    first.destroy()
    second.destroy()
  })

  it('adds a selected class while the floating menu is open', () => {
    const fakeDocument = {
      body: {
        append() {},
      },
      createElement: (tagName: string) =>
        createFakeElement(tagName.toUpperCase()),
      addEventListener(_event: string, _handler: EventListener) {},
      removeEventListener() {},
    }
    const fakeWindow = {
      addEventListener() {},
      removeEventListener() {},
      innerWidth: 1280,
      innerHeight: 720,
    }
    const bigEmoji = createFakeElement('B', {
      classNames: [BIG_EMOJI_CLASS, BIG_EMOJI_BIG_CLASS],
      dataset: { size: BIG_EMOJI_BIG_SIZE },
      textContent: `🤖${BIG_EMOJI_BIG_MARKER}`,
    })
    const block = createFakeElement('DIV')

    vi.stubGlobal('document', fakeDocument)
    vi.stubGlobal('window', fakeWindow)
    const tool = new BigEmojiTool({ api: {} as never })

    ;(
      tool as unknown as {
        showActions: (
          target: {
            kind: 'big'
            element: HTMLElement
            block: Element | null | undefined
          },
          anchorRect: DOMRect,
        ) => void
      }
    ).showActions(
      {
        kind: 'big',
        element: bigEmoji as unknown as HTMLElement,
        block: block as unknown as Element,
      },
      {
        left: 100,
        top: 100,
        width: 20,
        height: 20,
        bottom: 120,
      } as DOMRect,
    )

    expect(bigEmoji.classList.contains('inline-big-emoji-selected')).toBe(true)
    expect(block.classList.contains(BIG_EMOJI_SELECTED_BLOCK_CLASS)).toBe(true)
    ;(
      tool as unknown as {
        hideActions: () => void
      }
    ).hideActions()

    expect(bigEmoji.classList.contains('inline-big-emoji-selected')).toBe(false)
    expect(block.classList.contains(BIG_EMOJI_SELECTED_BLOCK_CLASS)).toBe(false)

    tool.destroy()
  })

  it('changing one big emoji size does not clear stick from another emoji', () => {
    const tool = Object.create(BigEmojiTool.prototype) as BigEmojiTool
    const resizedEmoji = createFakeElement('B', {
      classNames: [BIG_EMOJI_CLASS, BIG_EMOJI_BIG_CLASS],
      dataset: { size: BIG_EMOJI_BIG_SIZE },
      textContent: `🤖${BIG_EMOJI_BIG_MARKER}`,
    })
    const stickyEmoji = createFakeElement('B', {
      classNames: [BIG_EMOJI_CLASS, BIG_EMOJI_BIG_CLASS, BIG_EMOJI_STICK_CLASS],
      dataset: { size: BIG_EMOJI_BIG_SIZE, stick: 'true' },
      textContent: `🙂${BIG_EMOJI_BIG_MARKER}`,
    })
    const block = createFakeElement('DIV', {
      classNames: [BIG_EMOJI_STICK_BLOCK_CLASS],
    })

    block.querySelector = (selector: string) =>
      selector === `.${BIG_EMOJI_STICK_CLASS}` ? stickyEmoji : null
    ;(
      tool as unknown as {
        clearStickModeForElement: (
          block: Element | null | undefined,
          element: HTMLElement,
        ) => void
      }
    ).clearStickModeForElement(
      block as unknown as Element,
      resizedEmoji as unknown as HTMLElement,
    )

    expect(resizedEmoji.classList.contains(BIG_EMOJI_STICK_CLASS)).toBe(false)
    expect(stickyEmoji.classList.contains(BIG_EMOJI_STICK_CLASS)).toBe(true)
    expect(block.classList.contains(BIG_EMOJI_STICK_BLOCK_CLASS)).toBe(true)
  })

  it('normalizes typed emoji text nodes to default emoji blocks', () => {
    let replacement: FakeFragment | null = null
    const fakeDocument = {
      createElement: (tagName: string) =>
        createFakeElement(tagName.toUpperCase()),
      createDocumentFragment: () => {
        const fragment: FakeFragment = {
          children: [],
          append(...children) {
            this.children.push(...children)
          },
        }

        return fragment
      },
    }

    vi.stubGlobal('document', fakeDocument)

    const tool = Object.create(BigEmojiTool.prototype) as BigEmojiTool
    const textNode = {
      textContent: 'Hello 🤖 world',
      parentNode: {
        replaceChild: (next: FakeFragment) => {
          replacement = next
        },
      },
    } as unknown as Text

    expect(
      (
        tool as unknown as {
          normalizeEmojiTextNode: (node: Text) => boolean
        }
      ).normalizeEmojiTextNode(textNode),
    ).toBe(true)

    if (!replacement) {
      throw new Error('expected replacement fragment')
    }

    const fragment = replacement as FakeFragment

    expect(fragment.children).toHaveLength(3)
    expect(fragment.children[0]).toBe('Hello ')
    expect(fragment.children[2]).toBe(' world')
    expect((fragment.children[1] as FakeElement).dataset.size).toBe(
      BIG_EMOJI_DEFAULT_SIZE,
    )
    expect(
      (fragment.children[1] as FakeElement).classList.contains(BIG_EMOJI_CLASS),
    ).toBe(true)
  })
})
