import { computed } from 'vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'

type RgbColor = {
  red: number
  green: number
  blue: number
}

export type ContrastTextTone = 'black' | 'white'

function expandHexColor(value: string): string | null {
  if (/^#[\da-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  }

  if (/^#[\da-f]{4}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  }

  if (/^#[\da-f]{6}$/i.test(value)) {
    return value
  }

  if (/^#[\da-f]{8}$/i.test(value)) {
    return value.slice(0, 7)
  }

  return null
}

function parseHexColor(value: string): RgbColor | null {
  const expanded = expandHexColor(value.trim())

  if (expanded === null) {
    return null
  }

  const red = Number.parseInt(expanded.slice(1, 3), 16)
  const green = Number.parseInt(expanded.slice(3, 5), 16)
  const blue = Number.parseInt(expanded.slice(5, 7), 16)

  if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
    return null
  }

  return { red, green, blue }
}

function srgbChannelToLinear(channel: number): number {
  const normalized = channel / 255

  if (normalized <= 0.04045) {
    return normalized / 12.92
  }

  return ((normalized + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(color: RgbColor): number {
  const red = srgbChannelToLinear(color.red)
  const green = srgbChannelToLinear(color.green)
  const blue = srgbChannelToLinear(color.blue)

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function pickBlackOrWhiteTextTone(
  backgroundColor: string,
): ContrastTextTone {
  const parsedColor = parseHexColor(backgroundColor)

  if (parsedColor === null) {
    return 'black'
  }

  const luminance = relativeLuminance(parsedColor)
  const blackContrast = (luminance + 0.05) / 0.05
  const whiteContrast = 1.05 / (luminance + 0.05)

  return blackContrast >= whiteContrast ? 'black' : 'white'
}

function textContrastClass(tone: ContrastTextTone): string {
  return tone === 'black'
    ? 'sidebar-contrast-text-dark'
    : 'sidebar-contrast-text-light'
}

function selectedTextContrastClass(tone: ContrastTextTone): string {
  return tone === 'black'
    ? 'sidebar-contrast-selected-dark'
    : 'sidebar-contrast-selected-light'
}

/** Exposes the current app-wide theme tokens derived from persisted config. */
export function useAppTheme() {
  const { data: appConfigDisk } = useAppConfigDisk()
  const accentColor = computed(() => appConfigDisk.value.theme.accentColor)
  const sidebarBackgroundColor = computed(
    () => appConfigDisk.value.theme.sidebarBackgroundColor,
  )

  return {
    accentColor,
    sidebarBackgroundColor,
    sidebarTextContrastClass: computed(() =>
      textContrastClass(pickBlackOrWhiteTextTone(sidebarBackgroundColor.value)),
    ),
    sidebarSelectedTextContrastClass: computed(() =>
      selectedTextContrastClass(pickBlackOrWhiteTextTone(accentColor.value)),
    ),
    sidebarBadge: computed(() => appConfigDisk.value.theme.sidebarBadge),
    applicationTypeface: computed(
      () => appConfigDisk.value.theme.typography.application.typeface,
    ),
    applicationFontSize: computed(
      () => appConfigDisk.value.theme.typography.application.fontSize,
    ),
    editorTypeface: computed(
      () => appConfigDisk.value.theme.typography.editor.typeface,
    ),
    editorFontSize: computed(
      () => appConfigDisk.value.theme.typography.editor.fontSize,
    ),
  }
}
