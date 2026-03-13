export default defineNuxtConfig({
  srcDir: 'app',

  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@nuxt/eslint'],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  compatibilityDate: '2026-03-13',
})
