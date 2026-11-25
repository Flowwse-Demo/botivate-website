import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'

// Dev-only: serve /api/whatsapp locally with the same handler Vercel uses.
const whatsappDevApi = () => ({
  name: 'whatsapp-dev-api',
  configureServer(server) {
    Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
    server.middlewares.use('/api/whatsapp', async (req, res) => {
      const { default: handler } = await server.ssrLoadModule('/api/whatsapp.js')
      handler(req, res)
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    whatsappDevApi(),
  ],
  server: {
    host: true
  },
  optimizeDeps: {
    // pre-bundle the PDF reader so the first quotation upload does not trigger a dev re-optimization
    include: ["pdfjs-dist"],
  },
  base: "/",
  build: {
    outDir: "dist",
  },
})
