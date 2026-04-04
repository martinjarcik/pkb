export function markdownUrlFromEditorImageFileUrl(
  fileUrl: string,
  resolveMarkdownUrl: (fileUrl: string) => string,
): string {
  return resolveMarkdownUrl(fileUrl)
}

export function editorDisplayUrlForMarkdownImage(
  url: string,
  resolveAssetUrl: (relativePath: string) => string,
): string {
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('asset://') ||
    url.startsWith('/')
  ) {
    return url
  }

  return resolveAssetUrl(url)
}
