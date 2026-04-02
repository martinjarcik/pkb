import { computed, type Ref } from 'vue'
import { loadConfig } from '~/config/loader'
import en from '~/locales/en.json'

type Messages = Record<string, unknown>

const FALLBACK_LOCALE = 'en'

const localeMessages: Record<string, Messages> = {
  en,
}

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

const activeLocale = loadConfig().locale

function resolvedLocale(): string {
  return activeLocale in localeMessages ? activeLocale : FALLBACK_LOCALE
}

// Keep a standalone translator for composables and editor helpers that only need
// synchronous string lookup, not reactive locale state.
export function t(key: string): string {
  const messages =
    localeMessages[resolvedLocale()] ?? localeMessages[FALLBACK_LOCALE]

  return resolveKey(messages as Messages, key)
}

export function useTranslations(): {
  t: (key: string) => string
  locale: Ref<string>
} {
  const locale = computed(() => resolvedLocale())

  return { t, locale }
}
