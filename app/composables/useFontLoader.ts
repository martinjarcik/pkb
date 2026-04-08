const supportedFontFamilies = new Set([
  '"Noto Emoji", sans-serif',
  '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  '"Josefin Sans", "Trebuchet MS", "Gill Sans", sans-serif',
  '"Roboto", "Helvetica Neue", Arial, sans-serif',
  '"Open Sans", "Helvetica Neue", Arial, sans-serif',
  '"Rubik", "Avenir Next", "Helvetica Neue", sans-serif',
  '"DM Sans", "Avenir Next", "Helvetica Neue", sans-serif',
  '"Poppins", "Avenir Next", "Helvetica Neue", sans-serif',
  '"Lato", "Helvetica Neue", Arial, sans-serif',
  '"Nunito", "Avenir Next", "Helvetica Neue", sans-serif',
  '"Ubuntu", "Helvetica Neue", Arial, sans-serif',
  '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif',
  '"Work Sans", "Avenir Next", "Helvetica Neue", sans-serif',
  '"Manrope", "Avenir Next", "Helvetica Neue", sans-serif',
  '"Raleway", "Helvetica Neue", Arial, sans-serif',
  '"Montserrat", "Avenir Next", "Helvetica Neue", sans-serif',
  '"Playfair Display", Georgia, "Times New Roman", serif',
  '"Libre Baskerville", Georgia, "Times New Roman", serif',
  '"Neuton", Georgia, "Times New Roman", serif',
  '"Lora", Georgia, "Times New Roman", serif',
  '"JetBrains Mono", "Courier New", Courier, monospace',
  '"Arvo", Georgia, "Times New Roman", serif',
])

const loadedFontFamilies = new Set<string>()
const loadingFontFamilies = new Map<string, Promise<void>>()
const DEFAULT_FONT_PRELOAD_TEXT = 'PKB Inbox Tasks Favorites Trashed Settings'
const DEFAULT_FONT_WEIGHTS = ['400', '500', '600', '700']

function getPrimaryFontFamily(fontFamily: string): string | null {
  const firstFamily = fontFamily.split(',')[0]?.trim()

  if (!firstFamily) {
    return null
  }

  return firstFamily.replace(/^['"]|['"]$/g, '')
}

export function useFontLoader() {
  async function ensureFontLoaded(
    fontFamily: string,
    text: string = DEFAULT_FONT_PRELOAD_TEXT,
    weights: string[] = DEFAULT_FONT_WEIGHTS,
  ): Promise<void> {
    const cacheKey = `${fontFamily}::${weights.join(',')}::${text}`

    if (loadedFontFamilies.has(cacheKey)) {
      return
    }

    const pendingLoad = loadingFontFamilies.get(cacheKey)

    if (pendingLoad !== undefined) {
      await pendingLoad
      return
    }

    if (!supportedFontFamilies.has(fontFamily)) {
      loadedFontFamilies.add(cacheKey)
      return
    }

    const primaryFontFamily = getPrimaryFontFamily(fontFamily)

    if (!primaryFontFamily) {
      loadedFontFamilies.add(cacheKey)
      return
    }

    const loadPromise = Promise.all(
      weights.map((weight) =>
        document.fonts.load(`${weight} 1rem "${primaryFontFamily}"`, text),
      ),
    ).then(() => {
      loadedFontFamilies.add(cacheKey)
    })

    loadingFontFamilies.set(cacheKey, loadPromise)

    try {
      await loadPromise
    } finally {
      loadingFontFamilies.delete(cacheKey)
    }
  }

  async function ensureSidebarBadgeFontLoaded(
    sidebarBadge: string,
  ): Promise<void> {
    if (sidebarBadge.length === 0) {
      return
    }

    await ensureFontLoaded('"Noto Emoji", sans-serif', sidebarBadge, ['400'])
  }

  async function ensureApplicationFontLoaded(
    fontFamily: string,
  ): Promise<void> {
    await ensureFontLoaded(fontFamily, DEFAULT_FONT_PRELOAD_TEXT, [
      '400',
      '500',
      '600',
      '700',
    ])
  }

  async function ensureEditorFontLoaded(fontFamily: string): Promise<void> {
    await ensureFontLoaded(fontFamily, DEFAULT_FONT_PRELOAD_TEXT, [
      '400',
      '500',
      '700',
    ])
  }

  return {
    ensureFontLoaded,
    ensureApplicationFontLoaded,
    ensureEditorFontLoaded,
    ensureSidebarBadgeFontLoaded,
  }
}
