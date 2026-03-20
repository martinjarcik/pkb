import { describe, expect, it } from 'vitest'
import type { AppConfig } from '~/config/loader'
import { createLayoutState } from '~/composables/useLayout'

type LayoutConfig = AppConfig['layout']

describe('createLayoutState', () => {
  it('returns all optional panels visible when config enables them', () => {
    const layout: LayoutConfig = {
      showInspector: true,
      showSidebar: true,
      showNoteList: true,
    }

    expect(createLayoutState(layout)).toEqual({
      showInspector: true,
      showSidebar: true,
      showNoteList: true,
    })
  })

  it('hides sidebar when showSidebar is false', () => {
    const layout: LayoutConfig = {
      showInspector: true,
      showSidebar: false,
      showNoteList: true,
    }

    expect(createLayoutState(layout)).toEqual({
      showInspector: true,
      showSidebar: false,
      showNoteList: true,
    })
  })

  it('hides note list when showNoteList is false', () => {
    const layout: LayoutConfig = {
      showInspector: true,
      showSidebar: true,
      showNoteList: false,
    }

    expect(createLayoutState(layout)).toEqual({
      showInspector: true,
      showSidebar: true,
      showNoteList: false,
    })
  })

  it('hides inspector when showInspector is false', () => {
    const layout: LayoutConfig = {
      showInspector: false,
      showSidebar: true,
      showNoteList: true,
    }

    expect(createLayoutState(layout)).toEqual({
      showInspector: false,
      showSidebar: true,
      showNoteList: true,
    })
  })
})
