import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => tag === 'emoji-picker',
        },
      },
    }),
    AutoImport({
      imports: ['vue'],
      dts: false,
      vueTemplate: true,
    }),
    Components({
      dirs: ['app/components', 'app/components/ui'],
      dts: false,
      extensions: ['vue'],
      deep: true,
    }),
  ],
  resolve: {
    alias: {
      '~': resolve(__dirname, 'app'),
      '@': resolve(__dirname, 'app'),
    },
  },
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
})
