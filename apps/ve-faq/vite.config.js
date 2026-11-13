import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Hub tab addresses (/faq, /games, …) live outside the /login/ base.
// Serve the hub's index.html for them in dev and preview; production does the same in vercel.json.
const HUB_PATHS = /^\/(login|faq|questionnaire|sow|team-fund|games|sow-admin)\/?(\?.*)?$/

function hubPaths() {
  const rewrite = (req, _res, next) => {
    if (req.url && HUB_PATHS.test(req.url) && !req.url.startsWith('/login/')) {
      const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
      req.url = '/login/' + query
    }
    next()
  }
  return {
    name: 'hub-paths',
    configureServer(server) { server.middlewares.use(rewrite) },
    configurePreviewServer(server) { server.middlewares.use(rewrite) },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/login/',
  plugins: [hubPaths(), react()],
  server: {
    proxy: {
      '/faq-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
