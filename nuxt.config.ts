export default defineNuxtConfig({
  srcDir: 'app',

  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    'nuxt-security',
    '@nuxtjs/i18n',
    '@nuxt/fonts',
    '@nuxt/eslint',
  ],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  i18n: {
    defaultLocale: 'en',
    restructureDir: 'app',
    langDir: 'locales',
    locales: [{ code: 'en', file: 'en.json' }],
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  compatibilityDate: '2026-03-13',
})
