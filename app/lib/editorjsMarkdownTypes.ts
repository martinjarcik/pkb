export type EditorjsBlock = {
  type: string
  data: Record<string, unknown>
  cssClasses?: string[]
  tunes?: Record<string, unknown>
}

export type MdPoint = {
  line: number
  column: number
  offset: number
}

export type MdPosition = {
  start: MdPoint
  end: MdPoint
}

export type MarkdownNode = {
  type: string
  value?: string
  depth?: number
  ordered?: boolean
  checked?: boolean | null
  lang?: string | null
  url?: string
  alt?: string
  title?: string
  align?: Array<'left' | 'center' | 'right' | null>
  children?: MarkdownNode[]
  position?: MdPosition
}
