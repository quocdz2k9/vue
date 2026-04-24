import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true, // Cho phép listen trên tất cả IP
    allowedHosts: 'all', // Cho phép tất cả các host
    strictPort: true,
    // Thêm dòng này để fix lỗi chặn host của một số bản Vite đặc biệt
    cors: true,
    hmr: {
      host: 'stoic-hungry-balcony.ngrok-free.dev', // Link ngrok của bạn
    }
  }
})

