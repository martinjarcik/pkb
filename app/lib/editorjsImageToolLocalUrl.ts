const LOCAL_ASSET_URL_PREFIXES = [
  'asset://',
  'blob:',
  'http://asset.localhost/',
  'https://asset.localhost/',
] as const

export function isLocalEditorImageUrl(url: string): boolean {
  return LOCAL_ASSET_URL_PREFIXES.some((prefix) => url.startsWith(prefix))
}
