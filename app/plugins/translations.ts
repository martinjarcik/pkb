import { t } from '~/composables/useTranslations'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      t,
    },
  }
})
