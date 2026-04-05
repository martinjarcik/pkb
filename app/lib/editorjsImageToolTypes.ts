import type { HTMLPasteEventDetail } from '@editorjs/editorjs'

export type UploadOptions = {
  onPreview: (src: string) => void
}

export type ActionConfig = {
  name: string
  icon: string
  title: string
  toggle?: boolean
  action?: (name: string) => void
}

export type UploadResponseFormat = {
  success: number
  file: {
    url: string
  }
}

export type ImageToolData = {
  caption: string
  withBorder: boolean
  withBackground: boolean
  stretched: boolean
  file: {
    url: string
  }
  [key: string]: unknown
}

export type FeaturesConfig = {
  background?: boolean
  border?: boolean
  caption?: boolean | 'optional'
  stretch?: boolean
}

export type ImageToolDefaultElement =
  | 'caption'
  | 'withBorder'
  | 'stretched'
  | 'withBackground'

export type ImageConfig = {
  endpoints: {
    byFile?: string
    byUrl?: string
  }
  field?: string
  types?: string
  captionPlaceholder?: string
  additionalRequestData?: object
  additionalRequestHeaders?: object
  buttonContent?: string
  uploader?: {
    uploadByFile?: (file: Blob) => Promise<UploadResponseFormat>
    uploadByUrl?: (url: string) => Promise<UploadResponseFormat>
  }
  actions?: ActionConfig[]
  features?: FeaturesConfig
  defaultElements?: ImageToolDefaultElement[]
}

export type HTMLPasteEventDetailExtended = HTMLPasteEventDetail & {
  data: {
    src: string
  } & HTMLElement
}

export type ImageSetterParam = {
  url: string
}

export const ALL_DEFAULT_ELEMENTS: ImageToolDefaultElement[] = [
  'caption',
  'withBorder',
  'stretched',
  'withBackground',
]
