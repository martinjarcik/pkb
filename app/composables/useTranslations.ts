import { computed, type Ref } from 'vue'
import { useAppConfigDisk } from '~/composables/useAppConfigDisk'
import en from '~/locales/en.json'

type Messages = Record<string, unknown>

const FALLBACK_LOCALE = 'en'

const localeMessages: Record<string, Messages> = {
  en,
}

let localeRef: Ref<string> | null = null

function resolveKey(messages: Messages, key: string): string {
  const segments = key.split('.')
  let current: unknown = messages

  for (const segment of segments) {
    if (typeof current !== 'object' || current === null) {
      return key
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return typeof current === 'string' ? current : key
}

function resolveLocale(locale: string): string {
  return locale in localeMessages ? locale : FALLBACK_LOCALE
}

function currentLocaleRef(): Ref<string> {
  if (localeRef) {
    return localeRef
  }

  const { data: appConfigDisk } = useAppConfigDisk()
  localeRef = computed(() => resolveLocale(appConfigDisk.value.locale))

  return localeRef
}

// Keep a standalone translator for composables and editor helpers that only need
// synchronous string lookup, not reactive locale state.
export function t(key: string): string {
  const messages =
    localeMessages[currentLocaleRef().value] ?? localeMessages[FALLBACK_LOCALE]

  return resolveKey(messages as Messages, key)
}

/** Exposes synchronous locale lookup for components and composables. */
export function useTranslations(): {
  t: (key: string) => string
} {
  return { t }
}
