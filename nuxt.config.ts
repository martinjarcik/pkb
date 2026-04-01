export default defineNuxtConfig({
  srcDir: 'app',

  devtools: { enabled: false },

  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@nuxt/eslint'],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag === 'emoji-picker',
    },
  },

  vite: {
    optimizeDeps: {
      include: [
        'reka-ui',
        'tailwind-merge',
        'clsx',
        'class-variance-authority',
      ],
    },
  },

  compatibilityDate: '2026-03-13',
})
