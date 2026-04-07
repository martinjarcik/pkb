const fontLoaders: Record<string, () => Promise<unknown>> = {
  '"Noto Emoji", sans-serif': () => import('@fontsource/noto-emoji/index.css'),
  '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif': () =>
    import('@fontsource/inter/latin.css'),
  '"Josefin Sans", "Trebuchet MS", "Gill Sans", sans-serif': () =>
    import('@fontsource/josefin-sans/latin.css'),
  '"Roboto", "Helvetica Neue", Arial, sans-serif': () =>
    import('@fontsource/roboto/latin.css'),
  '"Open Sans", "Helvetica Neue", Arial, sans-serif': () =>
    import('@fontsource/open-sans/latin.css'),
  '"Rubik", "Avenir Next", "Helvetica Neue", sans-serif': () =>
    import('@fontsource/rubik/latin.css'),
  '"DM Sans", "Avenir Next", "Helvetica Neue", sans-serif': () =>
    import('@fontsource/dm-sans/latin.css'),
  '"Poppins", "Avenir Next", "Helvetica Neue", sans-serif': () =>
    import('@fontsource/poppins/latin.css'),
  '"Lato", "Helvetica Neue", Arial, sans-serif': () =>
    import('@fontsource/lato/latin.css'),
  '"Nunito", "Avenir Next", "Helvetica Neue", sans-serif': () =>
    import('@fontsource/nunito/latin.css'),
  '"Ubuntu", "Helvetica Neue", Arial, sans-serif': () =>
    import('@fontsource/ubuntu/latin.css'),
  '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif': () =>
    import('@fontsource/source-sans-pro/latin.css'),
  '"Work Sans", "Avenir Next", "Helvetica Neue", sans-serif': () =>
    import('@fontsource/work-sans/latin.css'),
  '"Manrope", "Avenir Next", "Helvetica Neue", sans-serif': () =>
    import('@fontsource/manrope/latin.css'),
  '"Raleway", "Helvetica Neue", Arial, sans-serif': () =>
    import('@fontsource/raleway/latin.css'),
  '"Montserrat", "Avenir Next", "Helvetica Neue", sans-serif': () =>
    import('@fontsource/montserrat/latin.css'),
  '"Playfair Display", Georgia, "Times New Roman", serif': () =>
    import('@fontsource/playfair-display/latin.css'),
  '"Libre Baskerville", Georgia, "Times New Roman", serif': () =>
    import('@fontsource/libre-baskerville/latin.css'),
  '"Neuton", Georgia, "Times New Roman", serif': () =>
    import('@fontsource/neuton/latin.css'),
  '"Lora", Georgia, "Times New Roman", serif': () =>
    import('@fontsource/lora/latin.css'),
  '"JetBrains Mono", "Courier New", Courier, monospace': () =>
    import('@fontsource/jetbrains-mono/latin.css'),
  '"Arvo", Georgia, "Times New Roman", serif': () =>
    import('@fontsource/arvo/latin.css'),
}

const loadedFontFamilies = new Set<string>()

function getPrimaryFontFamily(fontFamily: string): string | null {
  const firstFamily = fontFamily.split(',')[0]?.trim()

  if (!firstFamily) {
    return null
  }

  return firstFamily.replace(/^['"]|['"]$/g, '')
}

export function useFontLoader() {
  async function ensureFontLoaded(fontFamily: string): Promise<void> {
    if (loadedFontFamilies.has(fontFamily)) {
      return
    }

    const loadFont = fontLoaders[fontFamily]

    if (!loadFont) {
      loadedFontFamilies.add(fontFamily)
      return
    }

    await loadFont()
    loadedFontFamilies.add(fontFamily)

    const primaryFontFamily = getPrimaryFontFamily(fontFamily)

    if (!primaryFontFamily) {
      return
    }

    await Promise.all([
      document.fonts.load(`1rem "${primaryFontFamily}"`),
      document.fonts.load(`700 1rem "${primaryFontFamily}"`),
    ])
  }

  async function ensureSidebarBadgeFontLoaded(): Promise<void> {
    await ensureFontLoaded('"Noto Emoji", sans-serif')
  }

  return {
    ensureFontLoaded,
    ensureSidebarBadgeFontLoaded,
  }
}
