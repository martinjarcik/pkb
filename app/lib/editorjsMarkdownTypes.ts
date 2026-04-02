export type EditorjsBlock = {
  type: string
  data: Record<string, unknown>
  cssClasses?: string[]
  tunes?: Record<string, unknown>
}

/** Path prefix for vault image API (use with a leading `/` before relative paths). */
export const VAULT_ASSETS_API_PREFIX = '/api/vault-assets'

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
