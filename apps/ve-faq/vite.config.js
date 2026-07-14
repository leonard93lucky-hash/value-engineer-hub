import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/login/',
  plugins: [react()],
  server: {
    proxy: {
      '/faq-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
