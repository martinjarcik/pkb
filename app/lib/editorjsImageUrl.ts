export const VAULT_ASSETS_API_PREFIX = '/api/vault-assets'

function defaultMarkdownImageUrl(fileUrl: string): string {
  const prefix = `${VAULT_ASSETS_API_PREFIX}/`

  if (fileUrl.startsWith(prefix)) {
    return fileUrl.slice(prefix.length)
  }

  return fileUrl
}

export function markdownUrlFromEditorImageFileUrl(
  fileUrl: string,
  resolveMarkdownUrl: (fileUrl: string) => string = defaultMarkdownImageUrl,
): string {
  return resolveMarkdownUrl(fileUrl)
}

function defaultAssetUrl(relativePath: string): string {
  return `${VAULT_ASSETS_API_PREFIX}/${relativePath}`
}

export function editorDisplayUrlForMarkdownImage(
  url: string,
  resolveAssetUrl: (relativePath: string) => string = defaultAssetUrl,
): string {
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/')
  ) {
    return url
  }

  return resolveAssetUrl(url)
}
