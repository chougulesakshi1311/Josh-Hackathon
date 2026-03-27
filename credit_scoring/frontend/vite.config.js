import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/predict': 'http://localhost:8000',
      '/dashboard': 'http://localhost:8000',
      '/bias': 'http://localhost:8000',
    },
  },
})
