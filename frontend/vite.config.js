import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'


const rootPath = new URL('.', import.meta.url).pathname
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  css: {
    preprocessorOptions: {
        scss: {
            api: 'modern-compiler',
        },
    },
  },
  resolve: {
    alias: {
        '@': rootPath + 'src',
        stores: rootPath + 'src/stores',
        wailsjs: rootPath + 'wailsjs',
    },
  },


})
