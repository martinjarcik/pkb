import { VAULT_ASSETS_API_PREFIX } from './editorjsMarkdownTypes'

export function markdownUrlFromEditorImageFileUrl(fileUrl: string): string {
  const prefix = `${VAULT_ASSETS_API_PREFIX}/`

  if (fileUrl.startsWith(prefix)) {
    return fileUrl.slice(prefix.length)
  }

  return fileUrl
}

export function editorDisplayUrlForMarkdownImage(url: string): string {
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/')
  ) {
    return url
  }

  return `${VAULT_ASSETS_API_PREFIX}/${url}`
}
