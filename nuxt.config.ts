export default defineNuxtConfig({
  srcDir: 'app',

  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    'nuxt-security',
    '@nuxtjs/i18n',
    '@nuxt/icon',
    '@nuxt/fonts',
    'nuxt-tiptap-editor',
    '@nuxt/eslint',
  ],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  compatibilityDate: '2026-03-13',
})
