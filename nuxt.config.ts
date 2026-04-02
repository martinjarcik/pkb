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

  nitro: {
    compressPublicAssets: true,
  },

  vite: {
    optimizeDeps: {
      include: [
        'yaml',
        '@editorjs/editorjs',
        '@editorjs/header',
        '@editorjs/list',
        '@editorjs/code',
        '@editorjs/delimiter',
        '@editorjs/inline-code',
        '@editorjs/table',
        '@editorjs/image',
        '@vueuse/core',
        'lucide-vue-next',
        'emoji-picker-element',
        'remark',
        'remark-gfm',
        'remark-highlight-mark',
        'reka-ui',
        'tailwind-merge',
        'clsx',
        'class-variance-authority',
      ],
    },
  },

  compatibilityDate: '2026-03-13',
})
